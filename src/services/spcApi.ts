const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export interface Machine {
  machine_id: string;
  cmm_name: string | null;
  line: string | null;
  process: string | null;
  created_at: string;
}

export interface SPCMeasurement {
  cp: number;
  cpk: number;
  pp: number;
  ppk: number;
  avg: number;
  ucl: number;
  lcl: number;
  max: number;
  min: number;
  item: string;
  rBar: number;
  d2: number;
  status: string;
  nominal: number;
  stdWithin: number;
  stdOverall: number;
  columnName: string;
  sampleCount: number;
  processNumber: number;
  lowerSpecLimit: number;
  upperSpecLimit: number;
  lowerTolerance: number;
  upperTolerance: number;
  outOfSpecCount: number;
  outOfControlCount: number;
  subgroups: Array<{
    subgroupNumber: number;
    values: number[];
    average: number;
    range: number;
    size: number;
  }> | null;
}

export interface SPCChartData {
  machineId: string;
  machine_id: string;
  line: string;
  totalGroups: number;
  calculatedAt: string;
  calculationMethod: string;
  lastResultProcessId: string;
  totalSamplesProcessed: number;
  measurements: SPCMeasurement[];
}

export interface CreateMachineData {
  cmm_name: string;
  line: string;
  process: string;
}

export interface UpdateMachineData {
  cmm_name?: string;
  line?: string;
  process?: string;
}

// ================== MACHINES API ==================

export const fetchMachines = async (): Promise<Machine[]> => {
  const response = await fetch(`${API_BASE_URL}/machines`);
  if (!response.ok) {
    throw new Error("Error al obtener las máquinas");
  }
  return response.json();
};

export const fetchMachine = async (machineId: string): Promise<Machine> => {
  const response = await fetch(`${API_BASE_URL}/machines/${machineId}`);
  if (!response.ok) {
    throw new Error("Error al obtener la máquina");
  }
  return response.json();
};

export const createMachine = async (data: CreateMachineData): Promise<Machine> => {
  const response = await fetch(`${API_BASE_URL}/machines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al crear la máquina");
  }
  return response.json();
};

export const updateMachine = async (
  machineId: string,
  data: UpdateMachineData
): Promise<Machine> => {
  const response = await fetch(`${API_BASE_URL}/machines/${machineId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al actualizar la máquina");
  }
  return response.json();
};

export const deleteMachine = async (machineId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/machines/${machineId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Error al eliminar la máquina");
  }
};

// ================== SPC API ==================

export const fetchSPCMachines = async (): Promise<Array<{ machine_id: string; line: string; cmm_name: string }>> => {
  const response = await fetch(`${API_BASE_URL}/spc/machines`);
  if (!response.ok) {
    throw new Error("Error al obtener las máquinas SPC");
  }
  return response.json();
};

export const fetchProcessNumbers = async (machineId: string): Promise<string[]> => {
  const response = await fetch(
    `${API_BASE_URL}/spc/processes?machine_id=${encodeURIComponent(machineId)}`
  );
  if (!response.ok) {
    throw new Error("Error al obtener los procesos");
  }
  return response.json();
};

export interface SPCApiResponse {
  values: number[];
  machineId: string;
  machine_id: string;
  line: string;
  totalGroups: number;
  calculatedAt: string;
  measurements: SPCMeasurement[];
  calculationMethod: string;
  lastResultProcessId: string;
  totalSamplesProcessed: number;
}

export const fetchSPCChartData = async (
  machineId: string,
  processNumber: string,
  fromDate?: string,
  toDate?: string
): Promise<SPCApiResponse | null> => {
  let url = `${API_BASE_URL}/spc/chart-data?machine_id=${encodeURIComponent(machineId)}&process_number=${encodeURIComponent(processNumber)}`;
  
  if (fromDate) {
    url += `&from_date=${encodeURIComponent(fromDate)}`;
  }
  if (toDate) {
    url += `&to_date=${encodeURIComponent(toDate)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error("Error al obtener los datos SPC");
  }
  return response.json();
};

export interface AddProcessData {
  cmmName: string;
  process: string;
  line: string;
  date: string;
  turn: string;
  inspector_name: string;
  measurements: Array<{
    item: string;
    processNumber: string;
    columnName: string;
    value: number;
    nominal: number;
    upTol: number;
    lowTol: number;
  }>;
}

export const addProcess = async (data: AddProcessData): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/spc/add-process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Error al agregar el proceso");
  }
  return response.json();
};

// ================== ALERTS API ==================

export interface Alert {
  alert_id: string;
  machine_id: string;
  process_id: string;
  result_process_id: string;
  process_number: string | null;
  item: string | null;
  column_name: string | null;
  alert_type: string;
  value: number;
  nominal: number;
  upper_limit: number;
  lower_limit: number;
  deviation: number;
  measurement_index: number;
  status: string | null;
  severity: string | null;
  notes: string | null;
  created_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const fetchAlerts = async (
  machineId?: string,
  status?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<AlertsResponse> => {
  let url = `${API_BASE_URL}/spc/alerts?page=${page}&page_size=${pageSize}`;
  
  if (machineId) {
    url += `&machine_id=${encodeURIComponent(machineId)}`;
  }
  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error al obtener las alertas");
  }
  return response.json();
};

export const acknowledgeAlert = async (
  alertId: string,
  acknowledgedBy: string = "system",
  notes?: string
): Promise<Alert> => {
  // 🔧 Enviar como 'acknowledged_notes' porque así lo espera el backend
  let url = `${API_BASE_URL}/spc/alerts/${alertId}/acknowledge?acknowledged_by=${encodeURIComponent(acknowledgedBy || "system")}`;
  
  if (notes && notes.trim()) {
    // El backend usa 'acknowledged_notes', no 'notes'
    url += `&acknowledged_notes=${encodeURIComponent(notes)}`;
  }
  
  console.log("🚀 Acknowledge URL:", url);
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Error response:", errorText);
    throw new Error(`Error al reconocer la alerta: ${response.status}`);
  }
  return response.json();
};

export const resolveAlert = async (
  alertId: string,
  resolvedBy: string = "system",
  resolvedNotes?: string
): Promise<Alert> => {
  // 🔧 Enviar como 'resolved_notes' porque así lo espera el backend
  let url = `${API_BASE_URL}/spc/alerts/${alertId}/resolve?resolved_by=${encodeURIComponent(resolvedBy || "system")}`;
  
  if (resolvedNotes && resolvedNotes.trim()) {
    // El backend usa 'resolved_notes', mantener como está
    url += `&resolved_notes=${encodeURIComponent(resolvedNotes)}`;
  }
  
  console.log("🚀 Resolve URL:", url);
  
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Error response:", errorText);
    throw new Error(`Error al resolver la alerta: ${response.status}`);
  }
  return response.json();
};


// WebSocket URL for real-time alerts
export const getAlertsWebSocketUrl = (): string => {
  // Convert HTTP URL to WebSocket URL
  const wsUrl = API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");
  return `${wsUrl}/spc/ws/alerts`;
};

// Standard for acknowledged alert
export interface AcknowledgedAlert {
  type: 'alert_update';
  data: {
    event: 'alert_updated';
    change_type: 'acknowledged';
    acknowledgement: {
      old_acknowledged_by: string | null;
      new_acknowledged_by: string;
      acknowledged_at: string;
    };
    notes?: {
      old_notes: string | null;
      new_notes: string;
    };
  };
}

// Standard for resolved alert
export interface ResolvedAlert {
  type: 'alert_update';
  data: {
    event: 'alert_updated';
    change_type: 'resolved';
    resolution: {
      old_resolved_by: string | null;
      new_resolved_by: string;
      resolved_at: string;
    };
    notes?: {
      old_notes: string | null;
      new_notes: string;
    };
  };
}

// Standard for updated notes
export interface NotesUpdatedAlert {
  type: 'alert_update';
  data: {
    event: 'alert_updated';
    change_type: 'notes_updated';
    notes: {
      old_notes: string | null;
      new_notes: string;
      updated_by: string;
    };
  };
}
