import { useState, useRef, useEffect } from 'react';
import './Calendar.css';

export default function Calendar({ onDateSelect, selectedDate, minDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const handleDateClick = (day) => {
    if (!day) return;
    // FIXED: Use noon time to avoid timezone date shift
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12, 0, 0);
    onDateSelect(date);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    const d = new Date(date);
    // FIXED: Use UTC methods to avoid timezone shift
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const isDateDisabled = (day) => {
    if (!day) return true;
    // FIXED: Use noon time
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12, 0, 0);
    if (minDate) {
      const minD = new Date(minDate);
      minD.setHours(0, 0, 0, 0);
      return date < minD;
    }
    return false;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const selected = new Date(selectedDate);
    return day === selected.getDate() && 
           currentMonth.getMonth() === selected.getMonth() &&
           currentMonth.getFullYear() === selected.getFullYear();
  };

  return (
    <div className="calendar-container" ref={calendarRef}>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="calendar-input-btn"
      >
        <span style={{ marginRight: '10px', fontSize: '1.2em' }}>📅</span>
        {formatDate(selectedDate)}
      </button>

      {showCalendar && (
        <div className="calendar-dropdown">
          <div className="calendar-header">
            <button type="button" onClick={handlePrevMonth} className="calendar-nav-btn" aria-label="Previous Month">←</button>
            <h3 className="calendar-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button type="button" onClick={handleNextMonth} className="calendar-nav-btn" aria-label="Next Month">→</button>
          </div>

          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="calendar-weekday-label">{day}</div>
            ))}
          </div>

          <div className="calendar-days-grid">
            {days.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isDateDisabled(day)}
                className={[
                  'calendar-day',
                  isSelected(day) ? 'selected' : '',
                  isToday(day) && !isSelected(day) ? 'today' : '',
                  isDateDisabled(day) ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
                tabIndex={isDateDisabled(day) ? -1 : 0}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="calendar-close-btn"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}