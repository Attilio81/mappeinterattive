import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '../types/Activity';

// Importa le immagini usando URL diretti invece di import
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

// Componente per aggiustare la vista della mappa
const ChangeMapView = ({ center, zoom, shouldUpdate }: { center: [number, number]; zoom: number; shouldUpdate: boolean }) => {
  const map = useMap();
  
  useEffect(() => {
    if (shouldUpdate) {
      map.setView(center, zoom);
    }
  }, [center, zoom, shouldUpdate, map]);
  
  return null;
};

interface MappaAttivitaProps {
  attivita: Activity[];
  altezza?: string;
  larghezza?: string;
  zoom?: number;
  centroMappa?: [number, number]; // [lat, lng]
}

const MappaAttivita: React.FC<MappaAttivitaProps> = ({
  attivita,
  altezza = '500px',
  larghezza = '100%',
  zoom = 13,
  centroMappa
}) => {
  // Fix per le icone di default di Leaflet
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconUrl: iconUrl,
      shadowUrl: shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    centroMappa || 
    (attivita.length > 0 
      ? [attivita[0].latitudine, attivita[0].longitudine] 
      : [41.9028, 12.4964]) as [number, number]
  );
  const [mapZoom, setMapZoom] = useState(zoom);
  const isFirstRender = useRef(true);
  
  // Aggiorna il centro della mappa quando un'attività viene selezionata
  useEffect(() => {
    if (selectedActivity) {
      setMapCenter([selectedActivity.latitudine, selectedActivity.longitudine]);
      setMapZoom(16); // Zoom in quando si seleziona un'attività
    }
  }, [selectedActivity]);

  // Aggiorna la mappa solo al primo render o quando cambia centroMappa
  useEffect(() => {
    // Se è la prima renderizzazione o se centroMappa è cambiato esplicitamente
    if (isFirstRender.current || (centroMappa && (mapCenter[0] !== centroMappa[0] || mapCenter[1] !== centroMappa[1]))) {
      if (centroMappa) {
        setMapCenter(centroMappa);
        setMapZoom(zoom);
      }
      if (isFirstRender.current) {
        isFirstRender.current = false;
      }
    }
  }, [centroMappa, zoom]);

  // Gestione del link a Google Maps
  const openInGoogleMaps = (lat: number, lng: number, nome: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  return (
    <div className="mappa-attivita-container" style={{ height: altezza, width: larghezza }}>
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {attivita.map(a => (
          <Marker 
            key={a.id}
            position={[a.latitudine, a.longitudine]}
            icon={a.colorePin ? L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${a.colorePin}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">${a.icona || ''}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }) : undefined}
            eventHandlers={{
              click: () => setSelectedActivity(a)
            }}
          >
            <Popup>
              <div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>{a.nome}</h3>
                {a.categoria && <div style={{ margin: '4px 0', fontSize: '14px' }}>Categoria: {a.categoria}</div>}
                {a.descrizione && <p style={{ margin: '4px 0', fontSize: '14px' }}>{a.descrizione}</p>}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {a.data && `Data: ${new Date(a.data).toLocaleDateString()}`}
                </div>
                <button 
                  onClick={() => openInGoogleMaps(a.latitudine, a.longitudine, a.nome)}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Apri in Google Maps
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <ChangeMapView center={mapCenter} zoom={mapZoom} shouldUpdate={isFirstRender.current || !!selectedActivity} />
      </MapContainer>
    </div>
  );
};

export default MappaAttivita;