import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // 作ったファイルをインポート
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToEvents } from './dbService';
import './index.css';


const EventModal = ({ selectedDate, events, setEvents, closeModal, categoryModal, categoryOptions }) => {

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('all-day'); 
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState(categoryOptions[0]?.value || 'personal');

  if (!selectedDate) return null;

  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  //カテゴリの記入(ここを変更してカテゴリの記入をアプリ上でできるようにしたい)


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

  // 予定をFirebaseに保存するためのコード
  const handleSubmit = async () => { // ★asyncを付けます
    if (!title) {
      alert('予定を入力');
      return;
    }

    // 1. 保存するデータの中身を作る
    const newEvent = {
      title,
      type: eventType,
      category: category,
      dateKey: dateKey, // どの日の予定か（例: "2025-11-21"）
      ...(eventType === 'time' && { start: startTime, end: endTime }),
      createdAt: new Date()
    };

    try {
      // 2. Firebaseに保存
      // users / {ユーザーID} / events という場所にデータを追加します
      const { collection, addDoc } = await import('firebase/firestore'); 
      const userEventsRef = collection(db, "users", auth.currentUser.uid, "events");
      
      await addDoc(userEventsRef, newEvent);

      // 3. モーダルを閉じる
      closeModal();
      
      // 注意: 今まであった setEvents(...) は消しても大丈夫です！
      // 後で「Firebaseの変更を自動で読み取る仕組み」を App.js に入れるためです。

    } catch (error) {
      console.error("Firebase保存エラー:", error);
      alert("保存できませんでした。ログインしているか確認してください。");
    }
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
        {/*  カテゴリ追加コード  (12/19)*/}
        <button
          onClick={() =>categoryModal()}
          className="flex items-center p-2 rounded-full text-sm bg-gray-300 hover:bg-gray-400 transition-colors text-gray-700 font-bold" 
        >
          + 追加
        </button>
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

///カテゴリ追加用モーダル
const CategoryAddModal = ({ closeModal, onAddCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-purple-400');

  const colorOptions = [
    { value: 'bg-rose-400', label: '  ' },
    { value: 'bg-orange-300', label: '  ' },
    { value: 'bg-yellow-300', label: '  ' },
    { value: 'bg-emerald-300', label: '  ' },
    { value: 'bg-cyan-300', label: '  ' },
    { value: 'bg-sky-400', label: '  ' },
    { value: 'bg-purple-300', label: '  ' },
    { value: 'bg-pink-300', label: '  ' },
  ];

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('カテゴリ名を入力してください');
      return;
    }
    onAddCategory(newCategoryName, newCategoryColor);
    setNewCategoryName('');
    setNewCategoryColor('bg-purple-400');
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">新しいカテゴリを追加</h3>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">カテゴリ名</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-2">色を選択</label>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setNewCategoryColor(option.value)}
                className={`flex items-center p-4 rounded-full text-sm transition-shadow ${option.value} ${
                  newCategoryColor === option.value ? 'ring-4 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ color: 'white' }}
                title={option.label}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

const DayView = ({ selectedDate, events, setView, onDelete}) => {
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
  const hourHeight = 40;

  
// 表示モードで日にちをクリックした時の見た目を設定しているコード
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors"
          onClick={() => setView('month')} 
        >
          &lt; に戻る
        </button>
        <h2 className="text-xl font-bold text-gray-800">
          {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
        </h2>
        <div></div>
      </div>

      <h3 className="text-xl font-semibold mb-3">終日イベント</h3>
      <div className="mb-6 space-y-2">
        {allDayEvents.length > 0 ? (
          allDayEvents.map(event => (
            <div key={event.id} className={`p-2 rounded font-bold ${getEventClass(event.category)} flex justify-between items-center`}>
              <span>{event.title} (終日)</span>
              {/* 削除ボタンを追加 */}
              <button onClick={() => onDelete(dateKey, event.id)} className="ml-2 hover:text-red-600">🗑️</button>
            </div>
          ))
        ) : (
          <p className="text-gray-500">終日イベントはありません</p>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-3">時間スケジュール (1時間刻み)</h3>
      
      {/* ★ ここに「スクロール用の窓」を追加しました ★ */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto bg-white custom-scrollbar">
          
          {/* --- ここから下のロジックは一切変えていません --- */}
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
                  className={`absolute left-20 right-2 p-2 rounded text-sm border-l-4 font-medium ${getEventClass(event.category)} flex justify-between items-start group`}
                  style={{ top: `${top}px`, height: `${height}px`, overflow: 'hidden' }}
                >
                  <div className="truncate">
                    <div className="font-semibold text-sm truncate">{event.title}</div>
                    <div className="text-xs text-gray-700">{event.start} - {event.end}</div>
                  </div>
                  {/* 時間指定予定にも削除ボタンを追加 */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(dateKey, event.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-600 transition-opacity"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
          {/* --- ここまでロジック維持 --- */}

        </div>
      </div>
    </div>
  );
};

//ななみやったよ^ ^
//全体のアプリケーション表示に関するコード(月のカレンダーの画面のコード)
function App() {
  // --- 1. 状態（State）の定義 ---
  const [user, setUser] = useState(null); // ログインユーザー情報
  const [bgColor, setBgColor] = useState('from-pink-50 to-orange-50');
  const [events, setEvents] = useState({}); // すべての予定データ
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 19)); // 表示中の月
  const [showModal, setShowModal] = useState(false); // モーダルの開閉
  const [selectedDate, setSelectedDate] = useState(null); // 選択された日付
  const [view, setView] = useState('month'); // 'month' または 'day' 表示
  const [isReadOnly, setIsReadOnly] = useState(false); // 編集モードの切り替え

  // --- 2. ログイン状態の監視 ---
  useEffect(() => {
    // Firebaseがログイン状況を教えてくれる
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- 3. データのリアルタイム読み取り ---
  useEffect(() => {
    let unsubscribe;
    if (user) {
      // ログインしている時だけ、その人のデータをFirebaseから持ってくる
      unsubscribe = subscribeToEvents(user.uid, (loadedEvents) => {
        setEvents(loadedEvents);
      });
    } else {
      setEvents({}); // ログアウト時は空にする
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // --- 4. 各種アクション関数 ---
  
  // ログインボタンを押した時
  const handleLogin = async () => {
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("ログイン失敗:", error);
    }
  };

  // 予定を削除する時
  const handleDeleteEvent = async (dateKey, eventId) => {
    if (!window.confirm("この予定を削除しますか？")) return;
    try {
      const { doc, deleteDoc } = await import('firebase/firestore');
      // users / [UID] / events / [イベントID] を指定して削除
      await deleteDoc(doc(db, "users", user.uid, "events", eventId));
    } catch (error) {
      console.error("削除失敗:", error);
    }
  };

  // カレンダー操作
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (isReadOnly) {
      setView('day'); // 表示モードなら詳細へ
    } else {
      setShowModal(true); // 編集モードなら入力画面へ
    }
  };

  // --- 5. カレンダーのマス目（日付）を作るロジック ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dates = [];

  for (let i = 0; i < firstDay; i++) {
    dates.push(<div key={`empty-${i}`} className="h-20 bg-gray-50 border rounded-lg" />);
  }
  for (let i = 1; i <= lastDay; i++) {
    const d = new Date(year, month, i);
    const key = `${year}-${month + 1}-${i}`;
    const dayEvents = events[key] || [];
    dates.push(
      <div 
        key={i} 
        onClick={() => handleDateClick(d)} 
        className="h-20 border rounded-lg p-1 hover:bg-blue-50 cursor-pointer overflow-hidden"
      >
        <span className="text-xs font-bold">{i}</span>
        {dayEvents.slice(0, 2).map((e, idx) => (
          <div key={idx} className="text-[10px] bg-blue-100 truncate px-1 rounded mb-0.5">{e.title}</div>
        ))}
      </div>
    );
  }

  // --- 6. 画面の見た目（JSX） ---
  return (
    
    <div className={`min-h-screen bg-gradient-to-br ${bgColor} flex items-center justify-center p-4 transition-all duration-500`}>
      {!user ? (
        /* ログインしていない時の画面 */
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h2 className="text-2xl font-bold mb-6">🗓️ My Calendar</h2>
          <button onClick={handleLogin} className="w-full py-3 border rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 font-bold">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
            Googleでサインイン
          </button>
        </div>
      ) : (
        /* ログインしている時の画面 */
        <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
          
          {/* 右上の可愛いプロフィール表示 */}
          <div className="flex justify-between items-center mb-6 bg-pink-50/50 p-3 rounded-2xl">
            <div className="flex items-center space-x-3">
              <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="u" />
              <div>
                <p className="text-[10px] text-pink-400 font-bold uppercase">Welcome</p>
                <p className="text-sm font-bold text-gray-700">{user.displayName} さん</p>
              </div>
            </div>
            <button onClick={() => auth.signOut()} className="text-[10px] text-gray-400 underline hover:text-red-400">Logout</button>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 px-1">
            <button onClick={() => setBgColor('from-pink-50 to-orange-50')} className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-200 to-orange-200 border-2 border-white shadow-sm" />
            <button onClick={() => setBgColor('from-blue-50 to-cyan-50')} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 border-2 border-white shadow-sm" />
            <button onClick={() => setBgColor('from-green-50 to-teal-50')} className="w-6 h-6 rounded-full bg-gradient-to-br from-green-200 to-teal-200 border-2 border-white shadow-sm" />
            <button onClick={() => setBgColor('from-purple-50 to-indigo-50')} className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-200 to-indigo-200 border-2 border-white shadow-sm" />
            <button onClick={() => setBgColor('from-gray-700 to-gray-900')} className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-white shadow-sm" />
          </div>
          

          {showModal && (
            <EventModal 
              selectedDate={selectedDate} 
              closeModal={() => setShowModal(false)} 
            />
          )}
          
          {view === 'day' ? (
            <DayView 
              selectedDate={selectedDate} 
              events={events} 
              setView={setView} 
              onDelete={handleDeleteEvent} 
            />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth}>◀︎</button>
                <h3 className="font-bold text-lg">{year}年 {month + 1}月</h3>
                <button onClick={handleNextMonth}>▶︎</button>
              </div>
              <div className="flex justify-end mb-2">
                <button onClick={() => setIsReadOnly(!isReadOnly)} className={`text-[10px] px-3 py-1 rounded-full text-white ${isReadOnly ? 'bg-red-400' : 'bg-blue-400'}`}>
                  {isReadOnly ? '表示モード' : '編集モード'}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-2">
                {["日","月","火","水","木","金","土"].map(w => <div key={w}>{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">{dates}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;