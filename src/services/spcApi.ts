const API_BASE_URL = "https://spc-backend-lmgg.onrender.com/api/v1";

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

export const fetchSPCChartData = async (
  machineId: string,
  processNumber: string,
  fromDate?: string,
  toDate?: string
): Promise<SPCChartData | null> => {
  let url = `${API_BASE_URL}/spc/chart-data?machine_id=${encodeURIComponent(machineId)}&processNumber=${encodeURIComponent(processNumber)}`;
  
  if (fromDate) {
    url += `&from=${encodeURIComponent(fromDate)}`;
  }
  if (toDate) {
    url += `&to=${encodeURIComponent(toDate)}`;
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
