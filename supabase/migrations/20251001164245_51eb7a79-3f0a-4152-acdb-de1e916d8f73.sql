-- Fix spec limits calculation in calculate_spc_statistics function
CREATE OR REPLACE FUNCTION public.calculate_spc_statistics()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    elem jsonb;
    group_key text;
    grouped_measurements jsonb;
    measurement_values numeric[];
    all_stats jsonb[];
    avg_val numeric;
    std_val numeric;
    min_val numeric;
    max_val numeric;
    ucl_val numeric;
    lcl_val numeric;
    usl numeric;
    lsl numeric;
    cp_val numeric;
    cpk_val numeric;
    sample_cnt integer;
    out_spec_cnt integer;
    out_ctrl_cnt integer;
    process_status text;
    stats_item jsonb;
    i integer;
BEGIN
    -- Validar que hay measurements y es un array
    IF NEW.measurements IS NULL OR 
       jsonb_typeof(NEW.measurements) != 'array' OR
       jsonb_array_length(NEW.measurements) = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Crear un objeto temporal para agrupar mediciones
    grouped_measurements := '{}'::jsonb;
    
    -- Iterar sobre cada elemento del array
    FOR i IN 0..(jsonb_array_length(NEW.measurements) - 1) LOOP
        elem := NEW.measurements->i;
        
        -- Validar que el elemento tiene los campos necesarios
        IF elem ? 'processNumber' AND 
           elem ? 'item' AND 
           elem ? 'columnName' AND 
           elem ? 'value' THEN
            
            -- Crear la llave del grupo
            group_key := 
                COALESCE(elem->>'processNumber', '') || '_' || 
                COALESCE(elem->>'item', '') || '_' || 
                COALESCE(elem->>'columnName', '');
            
            -- Agrupar elementos por llave
            IF grouped_measurements ? group_key THEN
                grouped_measurements := jsonb_set(
                    grouped_measurements,
                    ARRAY[group_key],
                    (grouped_measurements->group_key) || jsonb_build_array(elem)
                );
            ELSE
                grouped_measurements := jsonb_set(
                    grouped_measurements,
                    ARRAY[group_key],
                    jsonb_build_array(elem)
                );
            END IF;
        END IF;
    END LOOP;
    
    -- Inicializar array de stats
    all_stats := ARRAY[]::jsonb[];
    
    -- Procesar cada grupo de mediciones
    FOR group_key IN SELECT jsonb_object_keys(grouped_measurements) LOOP
        
        -- Extraer valores numéricos del grupo
        measurement_values := ARRAY(
            SELECT (value->>'value')::numeric
            FROM jsonb_array_elements(grouped_measurements->group_key) AS value
            WHERE value->>'value' ~ '^-?[0-9]+\.?[0-9]*$'
        );
        
        -- Si no hay valores válidos, skip
        IF array_length(measurement_values, 1) IS NULL OR 
           array_length(measurement_values, 1) = 0 THEN
            CONTINUE;
        END IF;
        
        sample_cnt := array_length(measurement_values, 1);
        
        -- Calcular estadísticas básicas
        SELECT 
            AVG(v)::numeric,
            STDDEV_POP(v)::numeric,
            MIN(v)::numeric,
            MAX(v)::numeric
        INTO avg_val, std_val, min_val, max_val
        FROM unnest(measurement_values) AS v;
        
        -- Límites de control
        ucl_val := avg_val + (3 * COALESCE(std_val, 0));
        lcl_val := avg_val - (3 * COALESCE(std_val, 0));
        
        -- Obtener el primer elemento del grupo para especificaciones
        elem := grouped_measurements->group_key->0;
        
        -- Calcular Cp y Cpk si hay especificaciones válidas
        -- FIXED: USL = spec + upperTolerance, LSL = spec - lowerTolerance
        IF elem ? 'spec' AND 
           elem ? 'upperTolerance' AND 
           elem ? 'lowerTolerance' AND
           elem->>'upperTolerance' ~ '^-?[0-9]+\.?[0-9]*$' AND
           elem->>'lowerTolerance' ~ '^-?[0-9]+\.?[0-9]*$' AND
           elem->>'spec' ~ '^-?[0-9]+\.?[0-9]*$' AND
           std_val > 0 THEN
            
            usl := (elem->>'spec')::numeric + (elem->>'upperTolerance')::numeric;
            lsl := (elem->>'spec')::numeric - (elem->>'lowerTolerance')::numeric;
            
            cp_val := (usl - lsl) / (6 * std_val);
            cpk_val := LEAST(
                (usl - avg_val) / (3 * std_val),
                (avg_val - lsl) / (3 * std_val)
            );
            
            out_spec_cnt := (
                SELECT COUNT(*)
                FROM unnest(measurement_values) AS v
                WHERE v > usl OR v < lsl
            );
        ELSE
            usl := NULL;
            lsl := NULL;
            cp_val := NULL;
            cpk_val := NULL;
            out_spec_cnt := 0;
        END IF;
        
        out_ctrl_cnt := (
            SELECT COUNT(*)
            FROM unnest(measurement_values) AS v
            WHERE v > ucl_val OR v < lcl_val
        );
        
        -- Determinar estado
        IF sample_cnt < 3 THEN
            process_status := 'insufficient_data';
        ELSIF out_ctrl_cnt > 0 THEN
            process_status := 'out_of_control';
        ELSIF cpk_val IS NOT NULL AND cpk_val < 1.0 THEN
            process_status := 'warning';
        ELSE
            process_status := 'in_control';
        END IF;
        
        -- Construir objeto de stats para este grupo (sin rawData ni metadata extra)
        stats_item := jsonb_build_object(
            'cp', CASE WHEN cp_val IS NOT NULL THEN ROUND(cp_val, 3) ELSE NULL END,
            'avg', ROUND(avg_val, 4),
            'cpk', CASE WHEN cpk_val IS NOT NULL THEN ROUND(cpk_val, 3) ELSE NULL END,
            'lcl', ROUND(lcl_val, 4),
            'max', max_val,
            'min', min_val,
            'std', ROUND(COALESCE(std_val, 0), 4),
            'ucl', ROUND(ucl_val, 4),
            'processNumber', elem->>'processNumber',
            'lowerSpecLimit', lsl,
            'lowerTolerance', CASE WHEN elem->>'lowerTolerance' ~ '^-?[0-9]+\.?[0-9]*$' 
                                  THEN (elem->>'lowerTolerance')::numeric ELSE NULL END,
            'outOfSpecCount', out_spec_cnt,
            'upperSpecLimit', usl,
            'upperTolerance', CASE WHEN elem->>'upperTolerance' ~ '^-?[0-9]+\.?[0-9]*$' 
                                  THEN (elem->>'upperTolerance')::numeric ELSE NULL END,
            'outOfControlCount', out_ctrl_cnt
        );
        
        -- Agregar al array de stats
        all_stats := all_stats || stats_item;
            
    END LOOP;
    
    -- Insertar UN SOLO registro con todos los stats
    INSERT INTO spc_statistics (
        result_process_id,
        measurement_name,
        stats
    ) VALUES (
        NEW.result_process_id,
        'all_measurements',
        jsonb_build_object(
            'measurements', to_jsonb(all_stats),
            'totalGroups', array_length(all_stats, 1),
            'calculatedAt', now(),
            'calculationMethod', 'trigger_supabase_v2'
        )
    )
    ON CONFLICT (result_process_id, measurement_name) 
    DO UPDATE SET
        stats = EXCLUDED.stats,
        created_at = now();
    
    RETURN NEW;
END;
$function$;