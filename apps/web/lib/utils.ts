export function formatPublicStatus(status: string): string {
  const statusMap: Record<string, string> = {
    open: "Abierto",
    reserved: "Reservado",
    confirmed: "Confirmado",
    announced: "Anunciado",
    suspended: "Suspendido",
    unavailable: "No disponible",
  };

  return statusMap[status] || status;
}

export function formatInternalStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Borrador",
    looking_for_venue: "Buscando sede",
    ultimatum_sent: "Ultimátum enviado",
    ready: "Listo",
  };

  return statusMap[status] || status;
}

export function getPublicStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    open: "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 hover:bg-green-200 dark:hover:bg-green-300",
    reserved:
      "bg-yellow-300 text-yellow-800 dark:bg-yellow-200 dark:text-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-300",
    confirmed:
      "bg-orange-300 text-orange-800 dark:bg-orange-200 dark:text-orange-900 hover:bg-orange-200 dark:hover:bg-orange-300",
    announced:
      "bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-900 hover:bg-purple-200 dark:hover:bg-purple-300",
    suspended:
      "bg-red-400 text-red-800 dark:bg-red-200 dark:text-red-900 hover:bg-red-200 dark:hover:bg-red-300",
    unavailable:
      "bg-gray-400 text-gray-800 dark:bg-gray-200 dark:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-300",
  };

  return (
    colorMap[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-300"
  );
}

export function getInternalStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    draft:
      "bg-slate-100 text-slate-800 dark:bg-slate-200 dark:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-300",
    looking_for_venue:
      "bg-orange-100 text-orange-800 dark:bg-orange-200 dark:text-orange-900 hover:bg-orange-200 dark:hover:bg-orange-300",
    ultimatum_sent:
      "bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-900 hover:bg-red-200 dark:hover:bg-red-300",
    ready:
      "bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-900 hover:bg-green-200 dark:hover:bg-green-300",
  };

  return (
    colorMap[status] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-200 dark:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-300"
  );
}
