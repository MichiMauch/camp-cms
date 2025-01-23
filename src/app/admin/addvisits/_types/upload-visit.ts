export interface ExifData {
  modifyDate: string;
  gpsAltitude: number;
  latitude: number;
  longitude: number;
  address?: {
    display_name: string;
    tourism?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
    iso_alpha3?: string;
    [key: string]: unknown;
  };
}

export interface VisitFormProps {
  exifData: ExifData;
  startDate: Date;
  endDate: Date;
  fileName: string;
  imageUrl?: string;
  imageFile?: File;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddressInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}