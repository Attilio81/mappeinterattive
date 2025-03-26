import React, { useState, useEffect } from 'react';
import MappaAttivita from './MappaAttivita';
import { Activity } from '../types/Activity';
import { 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CardMedia, 
  CardActions,
  CardHeader,
  Chip, 
  IconButton, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  Alert,
  Fade,
  AlertColor,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Container,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Add as AddIcon, 
  Map as MapIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Place as PlaceIcon,
  Restaurant as RestaurantIcon,
  Museum as MuseumIcon,
  BrunchDining as CafeIcon,
  Hotel as HotelIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { 
  initDB, 
  getAllActivities, 
  addActivity, 
  updateActivity, 
  deleteActivity, 
  caricaDatiIniziali,
  getActivitiesByCategory 
} from '../services/indexedDBService';

// Definizione della struttura per le categorie
interface Categoria {
  nome: string;
  icona: JSX.Element;
  colore: string;
}

// Categorie disponibili per le attività
const categorie: Categoria[] = [
  { nome: 'Rock', icona: <PlaceIcon fontSize="small" />, colore: '#FF0000' },
  { nome: 'Pop', icona: <RestaurantIcon fontSize="small" />, colore: '#00CC00' },
  { nome: 'Jazz', icona: <MuseumIcon fontSize="small" />, colore: '#0000FF' },
  { nome: 'Classica', icona: <CafeIcon fontSize="small" />, colore: '#FF9900' },
  { nome: 'Festival', icona: <HotelIcon fontSize="small" />, colore: '#9900CC' }
];

// Hook personalizzato per gestire le notifiche
const useNotifica = () => {
  const [notifica, setNotifica] = useState<{ 
    visibile: boolean; 
    messaggio: string; 
    tipo: AlertColor 
  }>({ 
    visibile: false, 
    messaggio: '', 
    tipo: 'success' 
  });
  
  const mostraNotifica = (messaggio: string, tipo: AlertColor = 'success') => {
    setNotifica({ visibile: true, messaggio, tipo });
    setTimeout(() => {
      setNotifica(prev => ({ ...prev, visibile: false }));
    }, 3000);
  };
  
  return { notifica, mostraNotifica };
};

const MappaExample = () => {
  // Dati di esempio - concerti in Italia
  const datiIniziali: Activity[] = [
    {
      id: '1',
      nome: 'Vasco Rossi - Tour 2025',
      descrizione: 'Concerto di Vasco Rossi allo Stadio Olimpico',
      latitudine: 41.9341,
      longitudine: 12.4547,
      data: '2025-06-15',
      colorePin: '#FF0000',
      icona: '🎸',
      categoria: 'Rock'
    },
    {
      id: '2',
      nome: 'Concerto Laura Pausini',
      descrizione: 'Tour europeo, tappa di Milano',
      latitudine: 45.4781,
      longitudine: 9.1236,
      data: '2025-05-23',
      colorePin: '#00CC00',
      icona: '🎤',
      categoria: 'Pop'
    },
    {
      id: '3',
      nome: 'Orchestra Sinfonica Nazionale',
      descrizione: 'Concerto di musica classica al Teatro Massimo',
      latitudine: 38.1191,
      longitudine: 13.3598,
      data: '2025-07-10',
      colorePin: '#FF9900',
      icona: '🎻',
      categoria: 'Classica'
    },
    {
      id: '4',
      nome: 'Jazz Festival Perugia',
      descrizione: 'Festival internazionale del jazz',
      latitudine: 43.1107,
      longitudine: 12.3908,
      data: '2025-04-18',
      colorePin: '#0000FF',
      icona: '🎷',
      categoria: 'Jazz'
    },
    {
      id: '5',
      nome: 'Coldplay in concerto',
      descrizione: 'Tappa italiana del tour mondiale',
      latitudine: 40.8518,
      longitudine: 14.2681,
      data: '2025-06-02',
      colorePin: '#FF0000',
      icona: '🎸',
      categoria: 'Rock'
    },
    {
      id: '6',
      nome: 'Umbria Jazz Winter',
      descrizione: 'Festival invernale di jazz',
      latitudine: 42.7192,
      longitudine: 12.1113,
      data: '2025-04-05',
      colorePin: '#0000FF',
      icona: '🎷',
      categoria: 'Jazz'
    },
    {
      id: '7',
      nome: 'Festival di Sanremo',
      descrizione: 'Il più importante festival della canzone italiana',
      latitudine: 43.8159,
      longitudine: 7.7763,
      data: '2025-02-10',
      colorePin: '#9900CC',
      icona: '🎭',
      categoria: 'Festival'
    },
    {
      id: '8',
      nome: 'Opera Tosca',
      descrizione: 'Rappresentazione della Tosca di Puccini',
      latitudine: 45.4384,
      longitudine: 10.9916,
      data: '2025-07-26',
      colorePin: '#FF9900',
      icona: '🎭',
      categoria: 'Classica'
    }
  ];

  const [attivita, setAttivita] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Stato per il dialogo di aggiunta/modifica
  const [dialogoAperto, setDialogoAperto] = useState(false);
  const [attivitaSelezionata, setAttivitaSelezionata] = useState<Activity | null>(null);
  const [nuovaAttivita, setNuovaAttivita] = useState<Partial<Activity>>({
    nome: '',
    descrizione: '',
    categoria: 'Rock',
    data: new Date().toISOString().split('T')[0],
    latitudine: 41.9,
    longitudine: 12.5,
    colorePin: '#FF0000',
    icona: '🎸'
  });
  
  // Stato per la visualizzazione
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [vistaElenco, setVistaElenco] = useState(false);
  
  // Custom hook per le notifiche
  const { notifica, mostraNotifica } = useNotifica();

  // Tema e media query per responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Ottieni il numero di colonne in base alla dimensione dello schermo
  const getColumnCount = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  // Generare un'immagine placeholder per i concerti in base alla categoria
  // Nota: queste immagini non sono salvate nel database ma sono caricate da URL esterni
  const getImageUrl = (categoria?: string) => {
    switch(categoria) {
      case 'Rock':
        return 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
      case 'Pop':
        return 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
      case 'Jazz':
        return 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
      case 'Classica':
        return 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
      case 'Festival':
        return 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
      default:
        return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80';
    }
  };

  // Ottenere il colore del badge in base alla categoria
  const getCategoryColor = (categoria?: string) => {
    const categoriaObj = categorie.find(c => c.nome === categoria);
    return categoriaObj?.colore || '#cccccc';
  };

  // Inizializza il database e carica i dati iniziali all'avvio
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        const success = await initDB();
        if (success) {
          await caricaDatiIniziali(datiIniziali);
          const attivitaCaricate = await getAllActivities();
          setAttivita(attivitaCaricate);
          setDbInitialized(true);
          mostraNotifica('Database inizializzato con successo', 'success');
        }
      } catch (error) {
        console.error('Errore durante l\'inizializzazione del database:', error);
        mostraNotifica('Errore durante l\'inizializzazione del database', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Carica le attività filtrate quando cambia il filtro categoria
  useEffect(() => {
    const caricaAttivitaFiltrate = async () => {
      if (!dbInitialized) return;
      
      try {
        setIsLoading(true);
        let attivitaFiltrate: Activity[];
        
        if (filtroCategoria) {
          attivitaFiltrate = await getActivitiesByCategory(filtroCategoria);
        } else {
          attivitaFiltrate = await getAllActivities();
        }
        
        setAttivita(attivitaFiltrate);
      } catch (error) {
        console.error('Errore durante il caricamento delle attività:', error);
        mostraNotifica('Errore durante il caricamento delle attività', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    caricaAttivitaFiltrate();
  }, [filtroCategoria, dbInitialized]);

  // Effetto per impostare il colore e l'icona in base alla categoria
  useEffect(() => {
    if (nuovaAttivita.categoria) {
      const categoriaSelezionata = categorie.find(c => c.nome === nuovaAttivita.categoria);
      if (categoriaSelezionata) {
        setNuovaAttivita(prev => ({
          ...prev,
          colorePin: categoriaSelezionata.colore,
          icona: categoriaSelezionata.nome === 'Rock' ? '🎸' : 
                 categoriaSelezionata.nome === 'Pop' ? '🎤' :
                 categoriaSelezionata.nome === 'Jazz' ? '🎷' :
                 categoriaSelezionata.nome === 'Classica' ? '🎻' : '🎭'
        }));
      }
    }
  }, [nuovaAttivita.categoria]);

  // Funzione per aprire il dialogo di creazione
  const apriDialogoCreazione = () => {
    setAttivitaSelezionata(null);
    setNuovaAttivita({
      nome: '',
      descrizione: '',
      categoria: 'Rock',
      data: new Date().toISOString().split('T')[0],
      latitudine: 41.9,
      longitudine: 12.5,
      colorePin: '#FF0000',
      icona: '🎸'
    });
    setDialogoAperto(true);
  };

  // Funzione per aprire il dialogo di modifica
  const apriDialogoModifica = (attivitaDaModificare: Activity) => {
    setAttivitaSelezionata(attivitaDaModificare);
    setNuovaAttivita({...attivitaDaModificare});
    setDialogoAperto(true);
  };

  // Funzione per eliminare un'attività
  const eliminaAttivita = async (id: string) => {
    try {
      await deleteActivity(id);
      mostraNotifica("Attività eliminata con successo", "success");
      
      // Ricarica la lista delle attività
      const attivitaAggiornate = await getAllActivities();
      setAttivita(attivitaAggiornate);
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'attività:', error);
      mostraNotifica('Errore durante l\'eliminazione dell\'attività', 'error');
    }
  };

  // Funzione per salvare un'attività (nuova o modificata)
  const salvaAttivita = async () => {
    if (!nuovaAttivita.nome || nuovaAttivita.latitudine === undefined || nuovaAttivita.longitudine === undefined) {
      mostraNotifica("Compila tutti i campi obbligatori", "error");
      return;
    }

    if (attivitaSelezionata) {
      // Modifica di un'attività esistente
      try {
        const attivitaAggiornata: Activity = {
          id: attivitaSelezionata.id,
          nome: nuovaAttivita.nome || '',
          descrizione: nuovaAttivita.descrizione || '',
          latitudine: nuovaAttivita.latitudine || 0,
          longitudine: nuovaAttivita.longitudine || 0,
          data: nuovaAttivita.data || new Date().toISOString().split('T')[0],
          colorePin: nuovaAttivita.colorePin,
          icona: nuovaAttivita.icona,
          categoria: nuovaAttivita.categoria
        };
        
        await updateActivity(attivitaAggiornata);
        mostraNotifica(`Attività "${attivitaAggiornata.nome}" aggiornata con successo`, 'success');
        
        // Ricarica la lista delle attività
        const attivitaAggiornate = await getAllActivities();
        setAttivita(attivitaAggiornate);
      } catch (error) {
        console.error('Errore durante l\'aggiornamento dell\'attività:', error);
        mostraNotifica('Errore durante l\'aggiornamento dell\'attività', 'error');
      }
    } else {
      // Creazione di una nuova attività
      try {
        const nuovaAttivitaCompleta: Activity = {
          id: Date.now().toString(),
          nome: nuovaAttivita.nome || '',
          descrizione: nuovaAttivita.descrizione || '',
          latitudine: nuovaAttivita.latitudine || 0,
          longitudine: nuovaAttivita.longitudine || 0,
          data: nuovaAttivita.data || new Date().toISOString().split('T')[0],
          colorePin: nuovaAttivita.colorePin,
          icona: nuovaAttivita.icona,
          categoria: nuovaAttivita.categoria
        };
        
        await addActivity(nuovaAttivitaCompleta);
        mostraNotifica(`Nuova attività "${nuovaAttivitaCompleta.nome}" creata con successo`, 'success');
        
        // Ricarica la lista delle attività
        const attivitaAggiornate = await getAllActivities();
        setAttivita(attivitaAggiornate);
      } catch (error) {
        console.error('Errore durante la creazione dell\'attività:', error);
        mostraNotifica('Errore durante la creazione dell\'attività', 'error');
      }
    }
    
    setDialogoAperto(false);
  };

  // Funzione per filtrare le attività in base alla categoria
  const attivitaFiltrate = filtroCategoria
    ? attivita.filter(a => a.categoria === filtroCategoria)
    : attivita;
    
  // Ordinamento delle attività per data
  const attivitaOrdinatePerData = [...attivitaFiltrate].sort((a, b) => {
    return new Date(a.data).getTime() - new Date(b.data).getTime();
  });

  // Calcolatore categorie
  const conteggioCategorieMap = attivita.reduce((acc, a) => {
    if (a.categoria) {
      acc[a.categoria] = (acc[a.categoria] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ p: 3 }}>
      {/* Notifica */}
      <Fade in={notifica.visibile}>
        <Alert 
          severity={notifica.tipo} 
          sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 9999,
            boxShadow: 3
          }}
        >
          {notifica.messaggio}
        </Alert>
      </Fade>
      
      {/* Intestazione */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Mappa Concerti Italia
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />} 
            onClick={apriDialogoCreazione}
            sx={{ 
              borderRadius: '28px',
              px: 3,
              boxShadow: 3,
              '&:hover': {
                boxShadow: 6
              }
            }}
          >
            Aggiungi Concerto
          </Button>
        </Stack>
      </Box>
      
      {/* Filtri e categorie */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 4, 
          borderRadius: '12px',
          background: 'linear-gradient(to right, #f5f7fa, #ffffff)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mr: 2 }}>
            Filtra per categoria:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              key="tutti"
              label="Tutti"
              icon={<InfoIcon fontSize="small" />}
              onClick={() => setFiltroCategoria(null)}
              color={filtroCategoria === null ? 'primary' : 'default'}
              variant={filtroCategoria === null ? 'filled' : 'outlined'}
              sx={{ 
                borderRadius: '20px',
                '& .MuiChip-icon': {
                  color: filtroCategoria === null ? 'inherit' : '#555555'
                }
              }}
            />
            {categorie.map((categoria) => (
              <Chip
                key={categoria.nome}
                label={categoria.nome}
                icon={categoria.icona}
                onClick={() => setFiltroCategoria(categoria.nome)}
                color={filtroCategoria === categoria.nome ? 'primary' : 'default'}
                variant={filtroCategoria === categoria.nome ? 'filled' : 'outlined'}
                sx={{ 
                  borderRadius: '20px',
                  '& .MuiChip-icon': {
                    color: filtroCategoria === categoria.nome ? 'inherit' : categoria.colore
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            {filtroCategoria 
              ? `Concerti di categoria: ${filtroCategoria}` 
              : 'Tutti i concerti'}
          </Typography>
          
          <Tooltip title={vistaElenco ? 'Vista a griglia' : 'Vista a elenco'}>
            <IconButton 
              onClick={() => setVistaElenco(!vistaElenco)}
              color="primary"
            >
              {vistaElenco ? <ViewModuleIcon /> : <ViewListIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Mappa */}
      <Paper 
        elevation={3} 
        sx={{ 
          height: '400px', 
          width: '100%', 
          marginBottom: 3,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <MapIcon sx={{ mr: 1 }} /> Mappa dei Concerti
          </Typography>
        </Box>
        <MappaAttivita 
          attivita={attivitaOrdinatePerData} 
          altezza="350px"
          zoom={12}
        />
      </Paper>
      
      {/* Visualizzazione attività */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Elenco Concerti
      </Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        attivitaOrdinatePerData.length === 0 ? (
          <Box 
            sx={{ 
              my: 4, 
              p: 4, 
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'grey.300',
              borderRadius: '12px'
            }}
          >
            <Typography color="text.secondary" align="center" sx={{ mb: 2 }}>
              Nessun concerto trovato. Aggiungi un nuovo concerto per iniziare.
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={apriDialogoCreazione}
            >
              Aggiungi il tuo primo concerto
            </Button>
          </Box>
        ) : vistaElenco ? (
          <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <List sx={{ p: 0 }}>
              {attivitaOrdinatePerData.map((attivita) => (
                <React.Fragment key={attivita.id}>
                  <ListItem
                    secondaryAction={
                      <Box>
                        <Tooltip title="Modifica">
                          <IconButton edge="end" onClick={() => apriDialogoModifica(attivita)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Elimina">
                          <IconButton edge="end" color="error" onClick={() => eliminaAttivita(attivita.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    }
                  >
                    <ListItemIcon>
                      <Avatar 
                        sx={{ 
                          bgcolor: attivita.colorePin || '#cccccc',
                          color: '#ffffff',
                          fontSize: '1.2rem',
                          boxShadow: 2
                        }}
                      >
                        {attivita.icona || '📍'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight="bold">{attivita.nome}</Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {attivita.descrizione}
                          </Typography>
                          <Box display="flex" gap={2} mt={0.5}>
                            <Typography 
                              variant="caption" 
                              display="flex" 
                              alignItems="center"
                              sx={{ 
                                fontWeight: 'bold', 
                                color: 'primary.main' 
                              }}
                            >
                              <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {attivita.data ? new Date(attivita.data).toLocaleDateString('it-IT', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : 'N/A'}
                            </Typography>
                            <Typography variant="caption" display="flex" alignItems="center">
                              <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {attivita.latitudine.toFixed(4)}, {attivita.longitudine.toFixed(4)}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {attivitaOrdinatePerData.map((attivita) => (
              <Grid item xs={12} sm={6} md={4} key={attivita.id}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    borderRadius: '16px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={getImageUrl(attivita.categoria)}
                    alt={attivita.nome}
                    sx={{ position: 'relative' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        {attivita.nome}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {attivita.descrizione}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="primary"
                        display="flex" 
                        alignItems="center"
                        fontWeight="medium"
                      >
                        <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                        {attivita.data ? new Date(attivita.data).toLocaleDateString('it-IT', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                    </Stack>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      display="flex" 
                      alignItems="center"
                    >
                      <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {attivita.latitudine.toFixed(4)}, {attivita.longitudine.toFixed(4)}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
                    <Tooltip title="Modifica">
                      <IconButton 
                        size="small" 
                        onClick={() => apriDialogoModifica(attivita)}
                        sx={{ 
                          color: theme.palette.primary.main,
                          '&:hover': { backgroundColor: theme.palette.primary.main + '20' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Elimina">
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => eliminaAttivita(attivita.id)}
                        sx={{ '&:hover': { backgroundColor: theme.palette.error.main + '20' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}
      
      {/* Dialog per aggiunta/modifica attività */}
      <Dialog 
        open={dialogoAperto} 
        onClose={() => setDialogoAperto(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {attivitaSelezionata ? 'Modifica Concerto' : 'Nuovo Concerto'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nome *"
              fullWidth
              value={nuovaAttivita.nome || ''}
              onChange={(e) => setNuovaAttivita({ ...nuovaAttivita, nome: e.target.value })}
              required
            />
            
            <TextField
              label="Descrizione"
              fullWidth
              multiline
              rows={2}
              value={nuovaAttivita.descrizione || ''}
              onChange={(e) => setNuovaAttivita({ ...nuovaAttivita, descrizione: e.target.value })}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Categoria
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {categorie.map(cat => (
                  <Chip 
                    key={cat.nome}
                    label={cat.nome}
                    icon={cat.icona}
                    onClick={() => setNuovaAttivita({ ...nuovaAttivita, categoria: cat.nome })}
                    color={nuovaAttivita.categoria === cat.nome ? 'primary' : 'default'}
                    sx={{ '& .MuiChip-icon': { color: cat.colore } }}
                  />
                ))}
              </Box>
            </Box>
            
            <TextField
              label="Data"
              type="date"
              fullWidth
              value={nuovaAttivita.data || ''}
              onChange={(e) => setNuovaAttivita({ ...nuovaAttivita, data: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Latitudine *"
                  fullWidth
                  type="number"
                  value={nuovaAttivita.latitudine ?? ''}
                  onChange={(e) => setNuovaAttivita({ ...nuovaAttivita, latitudine: parseFloat(e.target.value) })}
                  required
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Longitudine *"
                  fullWidth
                  type="number"
                  value={nuovaAttivita.longitudine ?? ''}
                  onChange={(e) => setNuovaAttivita({ ...nuovaAttivita, longitudine: parseFloat(e.target.value) })}
                  required
                  inputProps={{ step: 0.0001 }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAperto(false)}>
            Annulla
          </Button>
          <Button 
            variant="contained" 
            onClick={salvaAttivita}
            color="primary"
          >
            Salva
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MappaExample;