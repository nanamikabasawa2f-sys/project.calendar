import React, { useState } from 'react';
import './index.css';

// ====================================================================
// 1. EventModal: 予定入力用のモーダルコンポーネント
// ====================================================================

/**
 * 予定入力用のモーダル。終日か時間指定かを選択し、色を設定できる。
 */
const EventModal = ({ selectedDate, events, setEvents, closeModal }) => {

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('all-day'); 
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('personal');

  if (!selectedDate) return null;

  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  //カテゴリの記入(ここを変更してカテゴリの記入をアプリ上でできるようにしたい)
  const categoryOptions = [
    { value: 'part-time', label: 'バイト', bgColor: 'bg-rose-400' },      // バイトは赤
    { value: 'school', label: '学校の予定', bgColor: 'bg-sky-400' },   // 学校は青
    { value: 'personal', label: 'プライベート', bgColor: 'bg-emerald-400' }, // プライベートは緑
    { value: 'other', label: 'その他', bgColor: 'bg-gray-400' },        // その他は灰色
  ];

  // 00:00 から 23:30 までの30分刻みの時間オプションを生成
  //1分刻みに変更　(11/28 長谷部)
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

  //予定が記入されなかった時のためのコード
  const handleSubmit = () => {
    if (!title) {
      alert('予定を入力');
      return;
    }
   //イベントの作成コード
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

  //スケジュール記入の際に出てくるウィンドウの見た目のコード
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
            className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
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
// 2. DayView: 日ごとのスケジュール表示コンポーネント
// ====================================================================

/**
 * 1日分のスケジュールを1時間刻みで表示するコンポーネント。
 */
const DayView = ({ selectedDate, events, setView }) => {
  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
  const dayEvents = events[dateKey] || [];
  
  const allDayEvents = dayEvents.filter(e => e.type === 'all-day');
  const timeEvents = dayEvents.filter(e => e.type === 'time');

  // 1時間刻みのタイムスロットを生成 (00:00〜23:00)
  const timeSlots = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  //カテゴリによって色を変えて表示(ここも変更して、スケジュール記入の時と合わせる)
  const getEventClass = (category) => {
    switch (category) {
      case 'part-time': return 'bg-rose-300 border-rose-600';
      case 'school': return 'bg-sky-300 border-sky-600';
      case 'personal': return 'bg-emerald-300 border-emerald-600';
      case 'other': return 'bg-gray-200 border-gray-500';
      default: return 'bg-gray-200 border-gray-500';
    }
  };

  // 1時間あたりの高さ（px）。見た目に合わせて調整してください
  const hourHeight = 64;

  //表示モードで日にちをクリックした時の見た目を設定しているコード
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          className="px-4 py-2 bg-gray-400 text-white rounded-lg shadow hover:bg-gray-500 transition-colors"
          onClick={() => setView('month')} // 月表示に戻る
        >
          &lt; に戻る
        </button>
        <h2 className="text-3xl font-bold text-gray-800">
          {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
        </h2>
        <div></div> {/* スペーサー */}
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
<>
  <p className="text-gray-500">終日イベントはありません</p>
  <h3 className="text-xl font-semibold mb-3">時間スケジュール (1時間刻み)</h3>
  <div className="border border-gray-200 rounded-lg overflow-hidden">
    {/* 全体高さを24時間分に設定、相対位置基準にする */}
    <div className="relative" style={{ height: `${hourHeight * 24}px` }}>
      {/* 時間行（ラベルと罫線）を描画 */}
      {timeSlots.map(slot => (
        <div key={`row-${slot}`} style={{ height: `${hourHeight}px` }} className="flex border-b border-gray-100">
          <div className="w-20 text-right p-2 text-sm text-gray-500 border-r border-gray-200">
            {slot}
          </div>
          <div className="flex-1 p-2" /> {/* 空白（イベントは絶対配置する） */}
        </div>
      ))}

      {/* イベントを絶対配置で一度だけ描画（またがる場合は高さで表現） */}
      {timeEvents.map(event => {
        const [sh, sm] = event.start.split(':').map(Number);
        const [eh, em] = event.end.split(':').map(Number);

        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        const top = (startMinutes / 60) * hourHeight;
        const height = Math.max((endMinutes - startMinutes) / 60 * hourHeight, 20); // 最小高さを確保

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
</>
        )}</div>
    </div>
  );
};

//全体のアプリケーション表示に関するコード(月のカレンダーの画面のコード)
function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // 2025/11/1
  const [events, setEvents] = useState({}); // { '2025-11-21': [{...}, {...}] }
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const [showModal, setShowModal] = useState(false); // モーダルの表示・非表示
  const [selectedDate, setSelectedDate] = useState(null); // クリックされた日付

  // ビューの切り替え: 'month' (月表示) または 'day' (日表示)
  const [view, setView] = useState('month');


  // --- ナビゲーション関数 ---
  const handleNextMonth = () => {
    const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(nextDate);
  };
  const handlePrevMonth = () => {
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prevDate);
  };

  // --- 日付クリック時の処理 ---
  const handleDateClick = (date) => {
    if (isReadOnly) {
      // 表示専用モードの場合、日表示に切り替え
      setSelectedDate(date);
      setView('day');
    } else {
      // 編集可能モードの場合、モーダルを開く
      setSelectedDate(date);
      setShowModal(true);
    }
  }

  // --- 月表示ロジック (既存) ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDayOfMonth.getDay(); 

  const dates = [];
  // (a) 月の始まる前の「空白」を埋める
  for (let i = 0; i < startDayOfWeek; i++) {
    dates.push(<div key={`empty-${i}`} className="border rounded-lg p-3 h-24 bg-gray-50"></div>);
  }

  // (b) 1日から最後の日までを埋める
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const date = new Date(year, month, i);
    const dateKey = `${year}-${month + 1}-${i}`;
    const dayEvents = events[dateKey] || [];

    const today = new Date();
    const isToday = year === today.getFullYear() &&
                    month === today.getMonth() &&
                    i === today.getDate();
    
    const dateClass = isToday
      ? "bg-sky-200 text-black font-bold" 
      : "hover:bg-sky-50 cursor-pointer";

    dates.push(
      <div 
        key={`date-${i}`} 
        className={`border rounded-lg p-3 h-24 transition-colors ${dateClass}`}
        onClick={() => handleDateClick(date)}
      >
        <p className="text-xs font-bold">
          {i}
        </p>
        
        {/* ★ 予定の表示 ★ */}
        <div className="mt-1 space-y-0.5">
          {dayEvents.slice(0, 2).map((event, index) => {
          const getCategoryClass = (category) => {
            switch (category) {
              case 'part-time': return { bg: 'bg-rose-200', text: 'text-rose-800', border: 'border-rose-600' };
              case 'school': return { bg: 'bg-sky-200', text: 'text-sky-800', border: 'border-sky-600' };
              case 'personal': return { bg: 'bg-emerald-200', text: 'text-emerald-800', border: 'border-emerald-600' };
              case 'other': return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500' };
              default: return { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-600' };
              }
            };
            const classes = getCategoryClass(event.category);
            return (
              <div 
                key={index} 
                className={`text-xs px-1 rounded truncate w-full 
                  ${classes.bg} ${classes.text}
                `}
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
  
  // --- メインレンダリング ---
  return (
    <div className="min-h-screen bg-gray-100 p-8"> 
      <div className="container mx-auto p-6 max-w-xl bg-white rounded-xl shadow-lg">
        
        {/* モーダル表示 */}
        {showModal && (
          <EventModal 
            selectedDate={selectedDate} 
            events={events}
            setEvents={setEvents}
            closeModal={() => setShowModal(false)}
          />
        )}
        
        {/* DayView (日表示) の表示 */}
        {view === 'day' && selectedDate ? (
          <DayView 
            selectedDate={selectedDate} 
            events={events}
            setView={setView}
          />
        ) : (
          // MonthView (月表示) の表示
          <div className="month-view">
            
            {/* 1. ヘッダー (ナビゲーションボタン) */}
            <div className="flex justify-between items-center mb-6">
              <button 
                className="px-4 py-2 bg-sky-400 text-white rounded-lg shadow hover:bg-sky-500 transition-colors"
                onClick={handlePrevMonth}
              >
                &lt; 前
              </button>
              <h2 className="text-3xl font-bold text-gray-800">
                {year}年 {month + 1}月 
              </h2>
              <button 
                className="px-4 py-2 bg-sky-400 text-white rounded-lg shadow hover:bg-sky-500 transition-colors"
                onClick={handleNextMonth}
              >
                次 &gt;
              </button>
            </div>
            
            {/* 📝 表示専用ボタンの追加 */}
            <div className="flex justify-end mb-4">
              <button 
                className={`px-3 py-1 text-sm rounded-full shadow-md transition-colors ${
                  isReadOnly 
                    ? "bg-rose-400 text-white hover:bg-rose-500" 
                    : "bg-emerald-400 text-white hover:bg-emerald-500"
                }`}
                onClick={() => setIsReadOnly(!isReadOnly)}
              >
                {isReadOnly ? "表示専用モード" : "編集可能モード"}
              </button>
            </div>


            {/* 2. 曜日グリッド */}
            <div className="grid grid-cols-7 gap-2 text-center font-semibold mb-2">
              {weekdays.map((day, index) => (
                <div key={day} className={`text-center ${index === 0 ? "text-rose-400" : index === 6 ? "text-sky-400" : "text-gray-600"}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* 3. 日付グリッド */}
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