import { useState, useEffect } from 'react';
import { fetchBuildings } from '../services/buildingService';
import { fetchTimeslots } from '../services/timeslotService';
import { useNotifications } from '../context/NotificationContext';

export const useCoreData = () => {
  const [buildings, setBuildings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { notifyError } = useNotifications();

  useEffect(() => {
    const loadCoreData = async () => {
      setLoading(true);
      try {
        const [buildingRes, timeslotRes] = await Promise.all([
          fetchBuildings(),
          fetchTimeslots(),
        ]);

        if (buildingRes.error) {
          console.error('Error loading buildings:', buildingRes.error);
          notifyError('Failed to load building data', {
            description: 'Using default model instead.'
          });
          setBuildings([]);
        } else {
          setBuildings(buildingRes.data || []);
        }

        if (timeslotRes.error) {
          console.error('Error loading time slots:', timeslotRes.error);
          notifyError('Failed to load time slots', {
            description: 'Schedule views may be incomplete until the issue is resolved.'
          });
          setTimeSlots([]);
        } else {
          setTimeSlots(timeslotRes.data || []);
        }

        if (buildingRes.error || timeslotRes.error) {
          setError(buildingRes.error || timeslotRes.error);
        }
      } catch (err) {
        console.error('Unexpected error loading core data:', err);
        notifyError('Failed to load application data', {
          description: 'Please try refreshing the page.',
        });
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadCoreData();
  }, [notifyError]);

  return { buildings, timeSlots, loading, error };
};
