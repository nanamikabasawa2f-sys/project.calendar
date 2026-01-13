import React, { useState } from 'react';
import './index.css';

// ====================================================================
// . EventModal: 予定入力用のモーダルコンポーネント
// ====================================================================

const EventModal = ({ selectedDate, events, setEvents, closeModal }) => {
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('all-day'); 
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('personal');

  if (!selectedDate) return null;

  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  const categoryOptions = [
    { value: 'part-time', label: 'バイト', bgColor: 'bg-red-500' },
    { value: 'school', label: '学校の予定', bgColor: 'bg-blue-500' },
    { value: 'personal', label: 'プライベート', bgColor: 'bg-green-500' },
    { value: 'other', label: 'その他', bgColor: 'bg-gray-500' },
  ];

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 1) {
        options.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        );
      }
    }
    return options;
  };
  const timeOptions = generateTimeOptions();

  const handleSubmit = () => {
    if (!title) {
      alert('予定を入力');
      return;
    }

    const newEvent = {
      id: Date.now(),
      title,
      type: eventType,
      category: category,
      ...(eventType === 'time' && { start: startTime, end: endTime })
    };

    setEvents(prevEvents => ({
      ...prevEvents,
      [dateKey]: [...(prevEvents[dateKey] || []), newEvent]
    }));
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日の予定を入力
        </h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">タイトル</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">種別</label>
          <div className="flex space-x-4">
            <label>
              <input
                type="radio"
                value="all-day"
                checked={eventType === 'all-day'}
                onChange={() => setEventType('all-day')}
                className="mr-2"
              />
              終日
            </label>
            <label>
              <input
                type="radio"
                value="time"
                checked={eventType === 'time'}
                onChange={() => setEventType('time')}
                className="mr-2"
              />
              時間指定
            </label>
          </div>
        </div>

        {eventType === 'time' && (
          <div className="mb-4 flex space-x-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">開始時間</label>
              <select
                className="p-2 border rounded"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              >
                {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">終了時間</label>
              <select
                className="p-2 border rounded"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              >
                {timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setCategory(option.value)}
                className={`flex items-center p-2 rounded-full text-sm transition-shadow ${option.bgColor} ${category === option.value ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
                style={{ color: 'white' }} 
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={closeModal}
          >
            キャンセル
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleSubmit}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 2. RepeatEventModal: 固定スケジュール追加用モーダルコンポーネント
// ====================================================================

const RepeatEventModal = ({ setEvents, close }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekday, setWeekday] = useState('1');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('personal');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const categoryOptions = [
    { value: 'part-time', label: 'バイト', bgColor: 'bg-red-500' },
    { value: 'school', label: '学校の予定', bgColor: 'bg-blue-500' },
    { value: 'personal', label: 'プライベート', bgColor: 'bg-green-500' },
    { value: 'other', label: 'その他', bgColor: 'bg-gray-500' },
  ];

  const weekdayOptions = [
    { value: '0', label: '日曜日' },
    { value: '1', label: '月曜日' },
    { value: '2', label: '火曜日' },
    { value: '3', label: '水曜日' },
    { value: '4', label: '木曜日' },
    { value: '5', label: '金曜日' },
    { value: '6', label: '土曜日' },
  ];

  const generateTimeOptions = () => {
    const options = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        options.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        );
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const handleSubmit = () => {
    if (!title || !startDate || !endDate) {
      alert('タイトル・開始日・終了日を入力してください');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('開始日は終了日より前にしてください');
      return;
    }

    const eventsToAdd = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      if (currentDate.getDay() === parseInt(weekday)) {
        const key = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
        const newEvent = {
          id: Date.now() + Math.random(),
          title,
          type: 'time',
          category,
          start: startTime,
          end: endTime,
        };
        eventsToAdd.push({ key, event: newEvent });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setEvents(prevEvents => {
      const newEvents = { ...prevEvents };
      eventsToAdd.forEach(({ key, event }) => {
        newEvents[key] = [...(newEvents[key] || []), event];
      });
      return newEvents;
    });

    alert(`${eventsToAdd.length}件のスケジュールを追加しました！`);
    close();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-96 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">固定スケジュールを追加</h3>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">スケジュール名</label>
          <input
            type="text"
            placeholder="例：バイト、数学の授業"
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4 flex space-x-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-bold mb-2">開始日</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-bold mb-2">終了日</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">繰り返す曜日</label>
          <select
            className="w-full p-2 border rounded"
            value={weekday}
            onChange={(e) => setWeekday(e.target.value)}
          >
            {weekdayOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex space-x-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-bold mb-2">開始時間</label>
            <select
              className="w-full p-2 border rounded"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              {timeOptions.map(time => (
                <option key={`start-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-bold mb-2">終了時間</label>
            <select
              className="w-full p-2 border rounded"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            >
              {timeOptions.map(time => (
                <option key={`end-${time}`} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">カテゴリ</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setCategory(option.value)}
                className={`flex items-center p-2 rounded-full text-sm transition-shadow ${option.bgColor} ${
                  category === option.value ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ color: 'white' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={close}
          >
            キャンセル
          </button>
          <button
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            onClick={handleSubmit}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 3. DayView: 日ごとのスケジュール表示コンポーネント
// ====================================================================

const DayView = ({ selectedDate, events, setView }) => {
  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
  const dayEvents = events[dateKey] || [];
  
  const allDayEvents = dayEvents.filter(e => e.type === 'all-day');
  const timeEvents = dayEvents.filter(e => e.type === 'time');

  const timeSlots = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  const getEventClass = (category) => {
    switch (category) {
      case 'part-time': return 'bg-red-300 border-red-600';
      case 'school': return 'bg-blue-300 border-blue-600';
      case 'personal': return 'bg-green-300 border-green-600';
      case 'other': return 'bg-gray-300 border-gray-600';
      default: return 'bg-gray-300 border-gray-600';
    }
  };

  const hourHeight = 64;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors"
          onClick={() => setView('month')}
        >
          &lt; 月表示に戻る
        </button>
        <h2 className="text-3xl font-bold text-gray-800">
          {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
        </h2>
        <div></div>
      </div>

      <h3 className="text-xl font-semibold mb-3">終日イベント</h3>
      <div className="mb-6 space-y-2">
        {allDayEvents.length > 0 ? (
          allDayEvents.map(event => (
            <div key={event.id} className={`p-2 rounded font-bold ${getEventClass(event.category)}`}>
              {event.title} (終日)
            </div>
          ))
        ) : (
          <p className="text-gray-500">終日イベントはありません</p>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-3">時間スケジュール (1時間刻み)</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="relative" style={{ height: `${hourHeight * 24}px` }}>
          {timeSlots.map(slot => (
            <div key={`row-${slot}`} style={{ height: `${hourHeight}px` }} className="flex border-b border-gray-100">
              <div className="w-20 text-right p-2 text-sm text-gray-500 border-r border-gray-200">
                {slot}
              </div>
              <div className="flex-1 p-2" />
            </div>
          ))}

          {timeEvents.map(event => {
            const [sh, sm] = event.start.split(':').map(Number);
            const [eh, em] = event.end.split(':').map(Number);

            const startMinutes = sh * 60 + sm;
            const endMinutes = eh * 60 + em;
            const top = (startMinutes / 60) * hourHeight;
            const height = Math.max((endMinutes - startMinutes) / 60 * hourHeight, 20);

            return (
              <div
                key={event.id}
                className={`absolute left-20 right-2 p-2 rounded text-sm border-l-4 font-medium ${getEventClass(event.category)}`}
                style={{ top: `${top}px`, height: `${height}px`, overflow: 'hidden' }}
              >
                <div className="font-semibold text-sm truncate">{event.title}</div>
                <div className="text-xs text-gray-700">{event.start} - {event.end}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// 4. App: メインのアプリケーションコンポーネント
// ====================================================================

function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));
  const [events, setEvents] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month');
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  const handleNextMonth = () => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(nextDate);
  };
  
  const handlePrevMonth = () => {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prevDate);
  };
  
  const handleNextYear = () => {
    const nextDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
    setCurrentDate(nextDate);
  };
  
  const handlePrevYear = () => {
    const prevDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
    setCurrentDate(prevDate);
  };

  const handleDateClick = (date) => {
    if (isReadOnly) {
      setSelectedDate(date);
      setView('day');
    } else {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay();

  const dates = [];
  
  for (let i = 0; i < startDayOfWeek; i++) {
    dates.push(<div key={`empty-${i}`} className="border rounded-lg p-3 h-24 bg-gray-50"></div>);
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(year, month, i);
    const dateKey = `${year}-${month + 1}-${i}`;
    const dayEvents = events[dateKey] || [];

    const today = new Date();
    const isToday = year === today.getFullYear() &&
                    month === today.getMonth() &&
                    i === today.getDate();
    
    const dateClass = isToday
      ? "bg-blue-500 text-white font-bold" 
      : "hover:bg-blue-50 cursor-pointer";

    dates.push(
      <div 
        key={`date-${i}`} 
        className={`border rounded-lg p-3 h-24 transition-colors ${dateClass}`}
        onClick={() => handleDateClick(date)}
      >
        <p className="text-xs font-bold">{i}</p>
        
        <div className="mt-1 space-y-0.5">
          {dayEvents.slice(0, 2).map((event, index) => {
            const getCategoryClass = (category) => {
              switch (category) {
                case 'part-time': return { bg: 'bg-red-200', text: 'text-red-800' };
                case 'school': return { bg: 'bg-blue-200', text: 'text-blue-800' };
                case 'personal': return { bg: 'bg-green-200', text: 'text-green-800' };
                case 'other': return { bg: 'bg-gray-200', text: 'text-gray-800' };
                default: return { bg: 'bg-gray-200', text: 'text-gray-800' };
              }
            };
            const classes = getCategoryClass(event.category);
            return (
              <div 
                key={index} 
                className={`text-xs px-1 rounded truncate w-full ${classes.bg} ${classes.text}`}
              >
                {event.title}
              </div>
            );
          })}
          {dayEvents.length > 2 && (
            <div className="text-xs text-gray-500">他 {dayEvents.length - 2}件</div>
          )}
        </div>
      </div>
    );
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="min-h-screen bg-gray-100 p-8"> 
      <div className="container mx-auto p-6 max-w-xl bg-white rounded-xl shadow-lg">
        
        {showModal && (
          <EventModal 
            selectedDate={selectedDate} 
            events={events}
            setEvents={setEvents}
            closeModal={() => setShowModal(false)}
          />
        )}
        
        {view === 'day' && selectedDate ? (
          <DayView 
            selectedDate={selectedDate} 
            events={events}
            setView={setView}
          />
        ) : (
          <div className="month-view">
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col gap-2">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                  onClick={handlePrevMonth}
                >
                  &lt; 前
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                  onClick={handlePrevYear}
                >
                  &lt; 前の年
                </button>
              </div>

              <h2 className="text-3xl font-bold text-gray-800 text-center">
                {year}年 {month + 1}月
              </h2>

              <div className="flex flex-col gap-2">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                  onClick={handleNextMonth}
                >
                  次 &gt;
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                  onClick={handleNextYear}
                >
                  次の年 &gt;
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <div className="flex gap-2">
                {!isReadOnly && (
                  <button 
                    className="px-3 py-1 text-sm bg-purple-500 text-white rounded-full shadow-md hover:bg-purple-600 transition-colors"
                    onClick={() => setShowRepeatModal(true)}
                  >
                    固定スケジュール追加
                  </button>
                )}
                <button 
                  className={`px-3 py-1 text-sm rounded-full shadow-md transition-colors ${
                    isReadOnly 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                  onClick={() => setIsReadOnly(!isReadOnly)}
                >
                  {isReadOnly ? "表示専用モード" : "編集可能モード"}
                </button>
              </div>
            </div>

            {showRepeatModal && (
              <RepeatEventModal 
                setEvents={setEvents}
                close={() => setShowRepeatModal(false)}
              />
            )}

            <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-600 mb-2">
              {weekdays.map(day => (
                <div key={day} className="text-center">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dates} 
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;