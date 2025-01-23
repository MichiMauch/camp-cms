export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  
  export const generateFileName = (name: string, date: string) => {
    const formattedName = name.toLowerCase().replace(/\s+/g, "-");
    const formattedDate = date.replace(/\./g, "-");
    return `${formattedName}-${formattedDate}`;
  };
  
  export const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      console.log("Fetching address for coordinates:", { latitude, longitude });
      const response = await fetch(
        `/api/nominatim?latitude=${latitude}&longitude=${longitude}`
      );
      if (!response.ok) {
        throw new Error("Fehler bei der Nominatim-API-Anfrage.");
      }
      const data = await response.json();
      console.log("Fetched address:", data);
      return data;
    } catch (err) {
      console.error(err);
      return "Fehler bei der Adresse.";
    }
  };
  
  