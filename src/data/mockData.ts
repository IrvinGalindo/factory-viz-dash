// Mock data for dashboard charts and recommendations
export const machines = [
  { id: 'machine-1', name: 'Máquina A - Producción' },
  { id: 'machine-2', name: 'Máquina B - Ensamble' },
  { id: 'machine-3', name: 'Máquina C - Empaque' },
  { id: 'machine-4', name: 'Máquina D - Control Calidad' },
];

export const generateMockData = (machineId: string) => {
  const baseData = {
    'machine-1': {
      efficiency: [
        { time: '00:00', value: 85 },
        { time: '04:00', value: 92 },
        { time: '08:00', value: 78 },
        { time: '12:00', value: 95 },
        { time: '16:00', value: 88 },
        { time: '20:00', value: 91 },
      ],
      production: [
        { month: 'Ene', produced: 1200, target: 1000 },
        { month: 'Feb', produced: 1350, target: 1200 },
        { month: 'Mar', produced: 980, target: 1100 },
        { month: 'Abr', produced: 1450, target: 1300 },
        { month: 'May', produced: 1320, target: 1200 },
        { month: 'Jun', produced: 1680, target: 1400 },
      ],
      status: [
        { name: 'Operando', value: 75, color: '#10B981' },
        { name: 'Mantenimiento', value: 15, color: '#F59E0B' },
        { name: 'Parada', value: 10, color: '#EF4444' },
      ],
      temperature: [
        { time: '00:00', temp: 45 },
        { time: '04:00', temp: 52 },
        { time: '08:00', temp: 48 },
        { time: '12:00', temp: 55 },
        { time: '16:00', temp: 49 },
        { time: '20:00', temp: 51 },
      ],
      recommendations: [
        {
          id: 1,
          priority: 'high',
          title: 'Mantenimiento Preventivo Requerido',
          description: 'Se recomienda realizar mantenimiento en las próximas 48 horas para evitar paradas no planificadas.',
          action: 'Programar mantenimiento'
        },
        {
          id: 2,
          priority: 'medium',
          title: 'Optimización de Velocidad',
          description: 'La velocidad actual puede incrementarse un 12% sin afectar la calidad del producto.',
          action: 'Ajustar parámetros'
        },
        {
          id: 3,
          priority: 'low',
          title: 'Calibración de Sensores',
          description: 'Los sensores de temperatura muestran variaciones menores. Calibración sugerida en 2 semanas.',
          action: 'Programar calibración'
        }
      ]
    },
    'machine-2': {
      efficiency: [
        { time: '00:00', value: 92 },
        { time: '04:00', value: 89 },
        { time: '08:00', value: 94 },
        { time: '12:00', value: 87 },
        { time: '16:00', value: 96 },
        { time: '20:00', value: 93 },
      ],
      production: [
        { month: 'Ene', produced: 800, target: 750 },
        { month: 'Feb', produced: 920, target: 850 },
        { month: 'Mar', produced: 780, target: 800 },
        { month: 'Abr', produced: 1050, target: 900 },
        { month: 'May', produced: 980, target: 950 },
        { month: 'Jun', produced: 1150, target: 1000 },
      ],
      status: [
        { name: 'Operando', value: 82, color: '#10B981' },
        { name: 'Mantenimiento', value: 12, color: '#F59E0B' },
        { name: 'Parada', value: 6, color: '#EF4444' },
      ],
      temperature: [
        { time: '00:00', temp: 38 },
        { time: '04:00', temp: 42 },
        { time: '08:00', temp: 40 },
        { time: '12:00', temp: 45 },
        { time: '16:00', temp: 41 },
        { time: '20:00', temp: 43 },
      ],
      recommendations: [
        {
          id: 1,
          priority: 'medium',
          title: 'Eficiencia Excelente',
          description: 'La máquina está operando por encima del promedio. Considerar como referencia para otras máquinas.',
          action: 'Documentar configuración'
        },
        {
          id: 2,
          priority: 'low',
          title: 'Inventario de Repuestos',
          description: 'Verificar stock de repuestos críticos para mantener el nivel de eficiencia actual.',
          action: 'Revisar inventario'
        }
      ]
    },
    'machine-3': {
      efficiency: [
        { time: '00:00', value: 76 },
        { time: '04:00', value: 82 },
        { time: '08:00', value: 79 },
        { time: '12:00', value: 85 },
        { time: '16:00', value: 81 },
        { time: '20:00', value: 84 },
      ],
      production: [
        { month: 'Ene', produced: 650, target: 700 },
        { month: 'Feb', produced: 720, target: 750 },
        { month: 'Mar', produced: 680, target: 700 },
        { month: 'Abr', produced: 790, target: 800 },
        { month: 'May', produced: 750, target: 780 },
        { month: 'Jun', produced: 820, target: 850 },
      ],
      status: [
        { name: 'Operando', value: 68, color: '#10B981' },
        { name: 'Mantenimiento', value: 22, color: '#F59E0B' },
        { name: 'Parada', value: 10, color: '#EF4444' },
      ],
      temperature: [
        { time: '00:00', temp: 52 },
        { time: '04:00', temp: 58 },
        { time: '08:00', temp: 55 },
        { time: '12:00', temp: 62 },
        { time: '16:00', temp: 57 },
        { time: '20:00', temp: 59 },
      ],
      recommendations: [
        {
          id: 1,
          priority: 'high',
          title: 'Revisión Urgente Requerida',
          description: 'Temperatura operando por encima del rango normal. Requiere inspección inmediata.',
          action: 'Inspección inmediata'
        },
        {
          id: 2,
          priority: 'high',
          title: 'Programa de Mejora',
          description: 'Eficiencia por debajo del objetivo. Implementar programa de optimización.',
          action: 'Iniciar programa de mejora'
        },
        {
          id: 3,
          priority: 'medium',
          title: 'Capacitación de Operadores',
          description: 'Mejorar conocimientos del equipo operativo para optimizar rendimiento.',
          action: 'Programar capacitación'
        }
      ]
    },
    'machine-4': {
      efficiency: [
        { time: '00:00', value: 97 },
        { time: '04:00', value: 95 },
        { time: '08:00', value: 98 },
        { time: '12:00', value: 94 },
        { time: '16:00', value: 99 },
        { time: '20:00', value: 96 },
      ],
      production: [
        { month: 'Ene', produced: 450, target: 400 },
        { month: 'Feb', produced: 480, target: 450 },
        { month: 'Mar', produced: 520, target: 500 },
        { month: 'Abr', produced: 590, target: 550 },
        { month: 'May', produced: 560, target: 530 },
        { month: 'Jun', produced: 620, target: 580 },
      ],
      status: [
        { name: 'Operando', value: 95, color: '#10B981' },
        { name: 'Mantenimiento', value: 4, color: '#F59E0B' },
        { name: 'Parada', value: 1, color: '#EF4444' },
      ],
      temperature: [
        { time: '00:00', temp: 35 },
        { time: '04:00', temp: 37 },
        { time: '08:00', temp: 36 },
        { time: '12:00', temp: 39 },
        { time: '16:00', temp: 37 },
        { time: '20:00', temp: 38 },
      ],
      recommendations: [
        {
          id: 1,
          priority: 'low',
          title: 'Rendimiento Óptimo',
          description: 'La máquina está operando de manera excelente. Mantener rutinas actuales.',
          action: 'Continuar monitoreo'
        },
        {
          id: 2,
          priority: 'low',
          title: 'Benchmark de Calidad',
          description: 'Utilizar esta máquina como referencia para mejorar otras unidades.',
          action: 'Crear protocolo estándar'
        }
      ]
    }
  };

  return baseData[machineId as keyof typeof baseData] || baseData['machine-1'];
};