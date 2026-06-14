import { useState, useEffect } from 'react';
import { markAttendance, getTodayAttendanceStatus } from '../../../../api';
import './AttendanceDashboard.css';
import { Clock, MousePointer2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AttendanceDashboard({ employeeCode }) {
  const [time, setTime] = useState(new Date());
  const [status, setStatus] = useState('loading'); // 'Not Clocked In', 'Clocked In', 'Clocked Out', 'loading'
  const [attendanceData, setAttendanceData] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Digital Clock Logic
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Today's Initial Status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getTodayAttendanceStatus(employeeCode);
        setStatus(res.data.status);
        setAttendanceData(res.data);
      } catch (err) {
        console.error('Failed to fetch status', err);
        setError('Connection Error: Could not reach server.');
      }
    };
    if (employeeCode) fetchStatus();
  }, [employeeCode]);

  const handleMarkAttendance = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await markAttendance({ employee_id: employeeCode });
      
      // Update local state after success
      const updatedStatus = await getTodayAttendanceStatus(employeeCode);
      setStatus(updatedStatus.data.status);
      setAttendanceData(updatedStatus.data);
      toast.success(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to mark attendance.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusDisplay = () => {
    if (status === 'Not Clocked In') return 'Ready to Clock In';
    if (status === 'Clocked In') {
      const clockIn = new Date(attendanceData?.time_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Present (Clocked-in at ${clockIn})`;
    }
    if (status === 'Clocked Out') {
        const clockOut = new Date(attendanceData?.time_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `Shift Ended (Clocked-out at ${clockOut})`;
    }
    return 'Synchronizing...';
  };

  return (
    <div className="attendance-card-premium">
      <div className="attendance-grid">
        {/* Left Side: Clock */}
        <div className="clock-section">
          <div className="clock-icon-wrapper">
            <Clock className="spinning-glow" size={32} />
          </div>
          <h2 className="digital-time">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </h2>
          <p className="current-date">
            {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Right Side: Action */}
        <div className="action-section">
          <div className="status-indicator">
            <div className={`status-dot ${status === 'Not Clocked In' ? 'inactive' : 'active'}`}></div>
            <span>Status: <strong>{getStatusDisplay()}</strong></span>
          </div>

          <button 
            className={`mark-btn ${status === 'Clocked In' ? 'out' : ''} ${status === 'Clocked Out' ? 'disabled' : ''}`}
            onClick={handleMarkAttendance}
            disabled={isProcessing || status === 'Clocked Out'}
          >
            {isProcessing ? 'Processing...' : status === 'Clocked In' ? 'Time-Out' : 'Time-In'}
            <MousePointer2 size={18} className="btn-icon" />
          </button>

          {error && (
            <div className="attendance-error">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {status === 'Clocked Out' && (
            <div className="attendance-success">
              <CheckCircle2 size={16} />
              <span>Successfully recorded today's shift.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceDashboard;
