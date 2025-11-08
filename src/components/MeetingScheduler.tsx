'use client';

import { useState } from 'react';

interface TimeSlot {
  date: Date;
  time: string;
  available: boolean;
}

interface MeetingSchedulerProps {
  clientId: string;
  onScheduled: (date: Date) => void;
}

export default function MeetingScheduler({ clientId, onScheduled }: MeetingSchedulerProps) {
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  // Generate available time slots for next 2 weeks
  // Mon-Fri, 9am-5pm EST, 30-min slots
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = new Date();
    const daysToShow = 14; // 2 weeks

    for (let dayOffset = 1; dayOffset <= daysToShow; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Add time slots for this day (9am - 5pm EST)
      const times = [
        '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
        '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
      ];

      times.forEach((time) => {
        const slotDate = new Date(date);
        const [timeStr, meridiem] = time.split(' ');
        let [hours, minutes] = timeStr.split(':').map(Number);

        if (meridiem === 'PM' && hours !== 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;

        slotDate.setHours(hours, minutes, 0, 0);

        slots.push({
          date: slotDate,
          time,
          available: true, // In production, check against existing meetings
        });
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Group slots by date
  const slotsByDate = timeSlots.reduce((acc, slot) => {
    const dateKey = slot.date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const handleSchedule = async () => {
    if (!selectedSlot) return;

    setIsScheduling(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clientId,
          proposal: {
            proposalMeetingDate: selectedSlot,
          },
          onboardingStage: 'meeting_scheduled',
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule meeting');

      onScheduled(selectedSlot);
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Schedule Your Proposal Discussion</h2>
      <p className="text-gray-600 mb-6">
        Select a time that works best for you to discuss your customized marketing proposal with our team.
      </p>

      {/* Selected slot display */}
      {selectedSlot && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900">Selected Time</p>
              <p className="text-lg font-semibold text-purple-700">
                {selectedSlot.toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}
              </p>
            </div>
            <button
              onClick={handleSchedule}
              disabled={isScheduling}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isScheduling ? 'Confirming...' : 'Confirm Meeting'}
            </button>
          </div>
        </div>
      )}

      {/* Time slots grid */}
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {Object.entries(slotsByDate).map(([dateKey, slots]) => (
          <div key={dateKey}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">{dateKey}</h3>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedSlot(slot.date)}
                  disabled={!slot.available}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSlot?.getTime() === slot.date.getTime()
                      ? 'bg-purple-600 text-white'
                      : slot.available
                      ? 'bg-gray-100 text-gray-900 hover:bg-purple-100 hover:text-purple-700'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>All times shown in Eastern Time (ET). Meeting duration: 30 minutes.</p>
      </div>
    </div>
  );
}
