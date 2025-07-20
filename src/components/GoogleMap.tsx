
import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GoogleMapProps {
  address: string;
  doctorName: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ address, doctorName }) => {
  const handleOpenInGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (!address) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <span className="text-gray-600">Adres bilgisi belirtilmemiş.</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-2">Adres:</h3>
          <p className="text-gray-700 mb-4 leading-relaxed">{address}</p>
          <Button 
            onClick={handleOpenInGoogleMaps}
            variant="outline"
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Google Maps'te Aç
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;
