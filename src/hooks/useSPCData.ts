import { useState, useEffect } from 'react';

interface SPCData {
  stats: any;
  rawValues: number[];
  subgroups: any[];
}

export const useSPCData = (
  machineId: string,
  process: string,
  fromDate?: string,
  toDate?: string
) => {
  const [data, setData] = useState<SPCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!machineId || !process) {
      setData(null);
      setLoading(false);
      return;
    }

    let url = `/api/spc/machine/${machineId}?process=${process}`;
    if (fromDate) url += `&from=${fromDate}`;
    if (toDate) url += `&to=${toDate}`;

    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Error en API');
        return res.json();
      })
      .then((response: any) => {
        if (response.measurements && response.measurements.length > 0) {
          const measurement = response.measurements.find(
            (m: any) => m.processNumber === process
          );
          if (measurement) {
            setData({
              stats: measurement,
              rawValues: measurement.allValues || [],
              subgroups: measurement.subgroups || [],
            });
          } else {
            setData(null);
          }
        } else {
          setData(null);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError('No se pudieron cargar los datos');
        setLoading(false);
      });
  }, [machineId, process, fromDate, toDate]);

  return { data, loading, error };
};
