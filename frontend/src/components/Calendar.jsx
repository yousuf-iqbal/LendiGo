import { useState } from 'react';

export default function Calendar({ onDateSelect, selectedDate, minDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
  const [showCalendar, setShowCalendar] = useState(false);

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
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
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
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDateDisabled = (day) => {
    if (!day) return true;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (minDate) {
      const minD = new Date(minDate);
      minD.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
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
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        style={styles.inputButton}
      >
        <span style={{ marginRight: '8px' }}>📅</span>
        {formatDate(selectedDate)}
      </button>

      {showCalendar && (
        <div style={styles.calendarDropdown}>
          <div style={styles.header}>
            <button type="button" onClick={handlePrevMonth} style={styles.navBtn}>←</button>
            <h3 style={styles.monthYear}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button type="button" onClick={handleNextMonth} style={styles.navBtn}>→</button>
          </div>

          <div style={styles.weekDaysRow}>
            {weekDays.map(day => (
              <div key={day} style={styles.weekDayLabel}>{day}</div>
            ))}
          </div>

          <div style={styles.daysGrid}>
            {days.map((day, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={isDateDisabled(day)}
                style={{
                  ...styles.day,
                  ...(isSelected(day) && styles.daySelected),
                  ...(isToday(day) && !isSelected(day) && styles.dayToday),
                  ...(isDateDisabled(day) && styles.dayDisabled),
                }}
              >
                {day}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            style={styles.closeBtn}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
  },
  inputButton: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '1rem',
    textAlign: 'left',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  calendarDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: '8px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 1000,
    minWidth: '340px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    padding: '8px',
    color: '#8B1538',
  },
  monthYear: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1a1a1a',
  },
  weekDaysRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '8px',
  },
  weekDayLabel: {
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#999',
    padding: '8px 0',
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '4px',
    marginBottom: '16px',
  },
  day: {
    aspect: '1',
    padding: 0,
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s',
    color: '#1a1a1a',
  },
  daySelected: {
    background: 'linear-gradient(135deg, #8B1538 0%, #6B0F1A 100%)',
    color: '#fff',
    border: 'none',
  },
  dayToday: {
    background: '#f0fdf4',
    border: '2px solid #16a34a',
  },
  dayDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  closeBtn: {
    width: '100%',
    padding: '10px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
};
