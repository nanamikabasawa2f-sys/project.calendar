import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; // 作ったファイルをインポート
import { onAuthStateChanged } from 'firebase/auth';
import { subscribeToEvents } from './dbService';
import { collection, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import './index.css';

const StartPage = ({
  today,
  events,
  onMonth,
  onNext
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-3xl">
      <div className="grid grid-cols-3 gap-6">

        {/* 左：今日の予定 */}
        <div className="col-span-2 border rounded-2xl overflow-hidden scale-90 origin-top-left max-h-[420px]">
          <DayView
            selectedDate={today}
            events={events}
            readOnly={true}
          />
        </div>

        {/* 右：ボタンエリア */}
        <div className="flex flex-col gap-4">

          <button
            onClick={onMonth}
            className="py-4 rounded-2xl bg-purple-400 text-white font-bold shadow"
          >
            月のカレンダーへ
          </button>

          <button
            onClick={onNext}
            className="py-4 rounded-2xl bg-gray-300 font-bold shadow"
          >
            日程調整
          </button>

        </div>
      </div>
    </div>
  );
};

const ScheduleListPage = ({ user, onBack, setSchedules, schedules, setSelectedScheduleId, setPage }) => {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">日程調整</h2>

      <button
        onClick={() => setShowCreate(true)}
        className="w-full py-3 rounded-xl bg-pink-400 text-white font-bold mb-4"
      >
        ＋ 新しく作る
      </button>

      {showCreate && (
        <CreateScheduleModal
          user={user}
          onClose={() => setShowCreate(false)}
          setSchedules={setSchedules}
        />
      )}

      <h3 className="font-bold mb-2">作成済みイベント</h3>
      <div className="space-y-2">
        {Object.values(schedules).length === 0 && (
          <p className="text-gray-500 text-sm">まだイベントがありません</p>
        )}

        {Object.values(schedules).map(schedule => (
          <div key={schedule.id} className="p-3 border rounded-lg flex justify-between items-center">
            <div>
              <p className="font-bold">{schedule.title}</p>
              <p className="text-sm text-gray-500">{schedule.startDate} 〜 {schedule.endDate}</p>
              <p className="text-xs text-gray-400">締切: {schedule.deadline}</p>
            </div>
            <button
              onClick={() => {
                // 回答ページに遷移
                setSelectedScheduleId(schedule.id);
                setPage("respond");
              }}
              className="px-3 py-1 bg-blue-400 text-white rounded"
            >
              回答する
            </button>
                <button
            onClick={() => {
              setSelectedScheduleId(schedule.id);
              setPage("summary");
            }}
            className="px-3 py-1 bg-green-400 text-white rounded"
          >
            回答一覧を見る
          </button>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="w-full py-2 mt-4 rounded-xl bg-gray-200 font-bold"
      >
        戻る
      </button>
    </div>
  );
};



const CreateScheduleModal = ({ user, onClose, setEvents, setSchedules }) => {
  const [eventName, setEventName] = useState("");
  const [yourName, setYourName] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  

  const handleCreate = async () => {
    if (!eventName || !yourName || !startDate || !endDate || !deadline) return;

    try {
      const newSchedule = {
        title: eventName,
        owner: yourName,
        ownerUid: user.uid,
        startDate,
        endDate,
        deadline,
        createdAt: new Date(),
      };

      // Firestore に保存
      const docRef = await addDoc(collection(db, "scheduleEvents"), newSchedule);

      alert(`イベント作成完了！URL: /schedule/${docRef.id}`);
      setSchedules(prev => ({
        ...prev,
        [docRef.id]: { ...newSchedule, id: docRef.id, responses: {} }
      }));

      onClose();
    } catch (error) {
      console.error("Firestore書き込みエラー:", error);
      alert("保存できません。権限設定を確認してください。");
    }
  };

  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
        <h3 className="font-bold mb-4">日程調整を作成</h3>
        <input placeholder="イベント名" value={eventName} onChange={e => setEventName(e.target.value)} className="w-full mb-2 border p-2 rounded" />
        <input placeholder="名前" value={yourName} onChange={e => setYourName(e.target.value)} className="w-full mb-2 border p-2 rounded" />
        <label>開始日</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mb-2 border p-2 rounded" />
        <label>終了日</label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mb-2 border p-2 rounded" />
        <label>回答期限</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full mb-4 border p-2 rounded" />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-200 rounded py-2">キャンセル</button>
          <button onClick={handleCreate} className="flex-1 bg-pink-400 text-white rounded py-2">作成</button>
        </div>
      </div>
    </div>
  );
};



const RespondSchedule = ({ schedule, onSubmit }) => {
  const [userName, setUserName] = useState("");

  // 日付リストを作る
  const dates = [];
  let current = new Date(schedule.startDate);
  const end = new Date(schedule.endDate);
  while (current <= end) {
    const key = `${current.getFullYear()}-${current.getMonth() + 1}-${current.getDate()}`;
    dates.push(key);
    current.setDate(current.getDate() + 1);
  }

  // 2時間刻み
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = i * 2;
    return h.toString().padStart(2, "0") + ":00~";
  });

  // answers を useState で初期化
  const [answers, setAnswers] = useState(() => {
    const defaultX = ["22:00~", "24:00~", "00:00~", "02:00~", "04:00~", "06:00~"];
    const initial = {};
    dates.forEach(date => {
      initial[date] = {};
      hours.forEach(hour => {
        initial[date][hour] = defaultX.includes(hour) ? "×" : "◯";
      });
    });
    return initial;
  });

  const handleClickSlot = (date, hour) => {
    const current = answers[date]?.[hour];
    const next = current === "◯" ? "△" : current === "△" ? "×" : "◯";

    setAnswers(prev => ({
      ...prev,
      [date]: { ...prev[date], [hour]: next }
    }));
  };

  const handleSubmit = async () => {
    if (!userName.trim()) {
      alert("名前を入力してください");
      return;
    }

    try {
      const responseRef = doc(db, "scheduleEvents", schedule.id, "responses", userName);
      await setDoc(responseRef, { answers });

      // ローカル State も更新
      onSubmit(userName, answers);
      alert("回答ありがとうございました！");
    } catch (error) {
      console.error("回答保存エラー:", error);
      alert("保存できませんでした。権限設定を確認してください。");
    }
  };


  const getCellColor = (val) => {
    if (val === "◯") return "bg-green-400 text-white";
    if (val === "△") return "bg-yellow-400 text-white";
    if (val === "×") return "bg-red-400 text-white";
    return "bg-gray-100";
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">{schedule.title}</h2>

      <input
        placeholder="名前"
        value={userName}
        onChange={e => setUserName(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />

      <table className="table-auto border-collapse border border-gray-300 w-full text-center text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1">日付 / 時間</th>
            {hours.map(hour => (
              <th key={hour} className="border border-gray-300 px-2 py-1">{hour}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dates.map(date => (
            <tr key={date}>
              <td className="border border-gray-300 px-2 py-1 font-semibold">{date}</td>
              {hours.map(hour => {
                const val = answers[date][hour];
                return (
                  <td
                    key={hour}
                    onClick={() => handleClickSlot(date, hour)}
                    className={`border border-gray-300 px-1 py-1 cursor-pointer ${getCellColor(val)}`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSubmit}
        className="mt-6 w-full py-2 bg-pink-400 text-white rounded-lg font-bold hover:bg-pink-500"
      >
        回答する
      </button>
    </div>
  );
};



const RespondScheduleSummaryMulti = ({ answers, onBack, onEditAnswer, onDeleteAnswer }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [tempAnswers, setTempAnswers] = useState({});

  // 日付と時間軸を整理
  const allDatesSet = new Set();
  const allHoursSet = new Set();
  Object.values(answers).forEach(userAns => {
    Object.keys(userAns).forEach(date => {
      allDatesSet.add(date);
      Object.keys(userAns[date]).forEach(hour => allHoursSet.add(hour));
    });
  });
  const allDates = Array.from(allDatesSet).sort();
  const allHours = Array.from(allHoursSet).sort((a,b)=>parseInt(a)-parseInt(b));

  // セルの色判定（×は非表示）
  const getCellColor = (date, hour) => {
    const hourValues = Object.values(answers)
      .map(u => u[date]?.[hour])
      .filter(v => v); // ×も含める
    if (hourValues.includes("×")) return ""; // 一人でも×があれば色なし
    if (hourValues.includes("△")) return "bg-yellow-200";
    if (hourValues.length > 0 && hourValues.every(v => v === "◯")) return "bg-green-200";
    return "";
  };

  

  // 編集用セルの色判定（×も含む）
  const getEditCellColor = (val) => {
    if (val === "◯") return "bg-green-400 text-white";
    if (val === "△") return "bg-yellow-400 text-white";
    if (val === "×") return "bg-red-400 text-white";
    return "";
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setTempAnswers(answers[user]);
  };

  const handleSaveEdit = () => {
    onEditAnswer?.(editingUser, tempAnswers);
    setEditingUser(null);
    setTempAnswers({});
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-4xl mx-auto overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">全員の回答一覧</h2>

      <table className="table-auto border-collapse border border-gray-300 w-full text-center text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1 text-xs">日付 / 時間</th>
            {allHours.map(hour => (
              <th key={hour} className="border border-gray-300 px-2 py-1 text-xs">{hour}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allDates.map(date => (
            <tr key={date}>
              <td className="border border-gray-300 px-2 py-1 font-semibold text-xs">{date}</td>
              {allHours.map(hour => {
                const bgClass = getCellColor(date, hour);
                const entries = Object.entries(answers)
                  .map(([user, userAns]) => {
                    const val = userAns[date]?.[hour];
                    if (!val || val === "×") return null; // 回答一覧では×非表示
                    return `${user}:${val}`;
                  })
                  .filter(v => v)
                  .join("\n");
                return (
                  <td key={hour} className={`border border-gray-300 px-1 py-1 ${bgClass} text-[10px] whitespace-pre-line`}>
                    {entries}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ユーザーごとの編集・削除ボタン */}
      <div className="mt-4 space-y-2">
        {Object.keys(answers).map(user => (
          <div key={user} className="flex justify-between items-center p-2 border rounded bg-gray-50 text-xs">
            <span className="font-semibold">{user}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenEdit(user)}
                className="px-2 py-1 bg-blue-400 text-white rounded text-xs"
              >
                編集
              </button>
              <button
                onClick={() => onDeleteAnswer?.(user)}
                className="px-2 py-1 bg-red-400 text-white rounded text-xs"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 戻るボタン */}
      <div className="flex justify-end mt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 font-bold text-sm"
        >
          戻る
        </button>
      </div>

      {/* 編集モーダル */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">{editingUser} の回答を編集</h3>
            <table className="table-auto border-collapse border border-gray-300 w-full text-center text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">日付 / 時間</th>
                  {allHours.map(hour => (
                    <th key={hour} className="border border-gray-300 px-2 py-1">{hour}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDates.map(date => (
                  <tr key={date}>
                    <td className="border border-gray-300 px-2 py-1 font-semibold">{date}</td>
                    {allHours.map(hour => {
                      const val = tempAnswers[date]?.[hour] || "×";
                      const bgClass = getEditCellColor(val);
                      return (
                        <td key={hour} className={`border border-gray-300 px-1 py-1 cursor-pointer ${bgClass}`}
                          onClick={() => {
                            // ◯ → △ → × → ◯
                            const next = val === "◯" ? "△" : val === "△" ? "×" : "◯";
                            setTempAnswers(prev => ({
                              ...prev,
                              [date]: { ...(prev[date] || {}), [hour]: next }
                            }));
                          }}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4 gap-3">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">キャンセル</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};




const EventModal = ({
  user,
  selectedDate,
  closeModal,
  categoryOptions,
  category,
  setCategory,
  categoryModal,
  onDeleteCategory,
}) => {

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('all-day'); 

  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('10');
  const [endM, setEndM] = useState('00');



  if (!selectedDate) return null;

  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));


  // 予定をFirebaseに保存するためのコード
  const handleSubmit = async () => { // ★asyncを付けます
    if (!title) {
      alert('予定を入力');
      return;
    }

    if (!user) {
      alert("ログインセッションが切れました。再ログインしてください。");
      return;
    }

    // 1. 保存するデータの中身を作る

    const fullStartTime = `${startH}:${startM}`;
    const fullEndTime = `${endH}:${endM}`;

    const newEvent = {
      title,
      type: eventType,
      category: category,
      categoryColor: categoryOptions.find(opt => opt.value === category)?.bgColor || 'bg-gray-400',
      dateKey: dateKey,
      ...(eventType === 'time' && { start: fullStartTime, end: fullEndTime }),
      createdAt: new Date()
    };

    try {
      const { collection, addDoc } = await import('firebase/firestore'); 
      // user.uid を使用
      const userEventsRef = collection(db, "users", user.uid, "events");
      await addDoc(userEventsRef, newEvent);
      closeModal();
    } catch (error) {
      console.error("Firebase保存エラー:", error);
      alert("保存できませんでした。Firebaseの権限設定を確認してください。");
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
          <div className="mb-4 flex space-x-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">開始</label>
              <div className="flex items-center space-x-1">
                <select className="flex-1 p-2 border rounded-lg bg-gray-50" value={startH} onChange={(e) => setStartH(e.target.value)}>
                  {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span>:</span>
                <select className="flex-1 p-2 border rounded-lg bg-gray-50" value={startM} onChange={(e) => setStartM(e.target.value)}>
                  {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">終了</label>
              <div className="flex items-center space-x-1">
                <select className="flex-1 p-2 border rounded-lg bg-gray-50" value={endH} onChange={(e) => setEndH(e.target.value)}>
                  {hourOptions.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span>:</span>
                <select className="flex-1 p-2 border rounded-lg bg-gray-50" value={endM} onChange={(e) => setEndM(e.target.value)}>
                  {minuteOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

    <div className="mb-6">
      <label className="block text-gray-700 font-bold mb-2">カテゴリ</label>
      <div className="flex flex-wrap gap-2">
        {categoryOptions.map(option => (
          /* groupクラスを追加して、中の×ボタンを制御できるようにします */
          <div key={option.id || option.value} className="relative group">
            <button
              onClick={() => setCategory(option.value)}
              className={`flex items-center p-2 rounded-full text-sm transition-shadow ${option.bgColor} ${category === option.value ? 'ring-4 ring-offset-2 ring-gray-400' : ''}`}
              style={{ color: 'white' }} 
            >
              {option.label}
            </button>

            {/* 削除ボタン： option.idがある＝Firebaseに保存されている時だけ表示 */}
            {option.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 親ボタンの「選択」イベントが動かないようにする
                  onDeleteCategory(option.id); // App.jsから渡された削除関数を呼ぶ
                }}
                className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                title="カテゴリを削除"
              >
                ×
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={() => categoryModal()}
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
                className={`w-8 h-8 rounded-full transition-all ${option.value} ${
                  newCategoryColor === option.value ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-400 text-sm font-bold"
            onClick={closeModal}
          >
            キャンセル
          </button>
          <button
            className="px-6 py-2 bg-pink-400 text-white rounded-xl text-sm font-bold shadow-md hover:bg-pink-500"
            onClick={handleAddCategory}
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  );
};
const DayView = ({ selectedDate, events, setView, onDelete, readOnly = false}) => {
  const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
  const dayEvents = events[dateKey] || [];
  
  const allDayEvents = dayEvents.filter(e => e.type === 'all-day');
  const timeEvents = dayEvents.filter(e => e.type === 'time');

  // 1時間刻みのタイムスロットを生成 (00:00〜23:00)
  const timeSlots = Array.from({ length: 24 }, (_, i) => 
    `${i.toString().padStart(2, '0')}:00`
  );

  // 1時間あたりの高さ（px）。見た目に合わせて調整してください
  const hourHeight = 40;

  
// 表示モードで日にちをクリックした時の見た目を設定しているコード
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">

        {!readOnly && (
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-600 transition-colors"
          onClick={() => setView('month')} 
        >
          &lt; に戻る
        </button>
        )}

        <h2 className="text-xl font-bold text-gray-800">
          {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
        </h2>
        <div></div>
      </div>

      <h3 className="text-xl font-semibold mb-3">終日イベント</h3>
      <div className="mb-6 space-y-2">
        {allDayEvents.length > 0 ? (
          allDayEvents.map(event => (
            <div 
              key={event.id} 
              /* 保存されたカテゴリの色 (event.categoryColor) を適用 */
              className={`p-3 rounded-xl font-bold text-white shadow-sm flex justify-between items-center ${event.categoryColor || 'bg-gray-400'}`}
            >
              <span>{event.title} (終日)</span>
              {!readOnly && (
              <button 
                onClick={() => onDelete(dateKey, event.id)} 
                className="ml-2 bg-white/20 p-1 rounded-full hover:bg-white/40 transition-colors"
              >
                🗑️
              </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500">終日イベントはありません</p>
        )}
      </div>

      <h3 className="text-xl font-semibold mb-3">時間スケジュール</h3>
      
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
        <div className="max-h-[450px] overflow-y-auto bg-white custom-scrollbar">
          
          <div className="relative" style={{ height: `${hourHeight * 24}px` }}>
            {timeSlots.map(slot => (
              <div key={`row-${slot}`} style={{ height: `${hourHeight}px` }} className="flex border-b border-gray-100">
                <div className="w-16 text-right pr-2 pt-1 text-[10px] text-gray-400 font-mono">
                  {slot}
                </div>
                <div className="flex-1" />
              </div>
            ))}

            {timeEvents.map(event => {
              const [sh, sm] = event.start.split(':').map(Number);
              const [eh, em] = event.end.split(':').map(Number);
              const startMinutes = sh * 60 + sm;
              const endMinutes = eh * 60 + em;
              const top = (startMinutes / 60) * hourHeight;
              const height = Math.max((endMinutes - startMinutes) / 60 * hourHeight, 30);

              return (
                <div
                  key={event.id}
                  /* 保存されたカテゴリの色 (event.categoryColor) を適用 */
                  className={`absolute left-16 right-2 p-2 rounded-lg text-xs font-bold text-white shadow-md flex justify-between items-start group border-l-4 border-white/30 ${event.categoryColor || 'bg-sky-400'}`}
                  style={{ top: `${top}px`, height: `${height}px`, overflow: 'hidden' }}
                >
                  <div className="truncate">
                    <div className="truncate">{event.title}</div>
                    <div className="text-[10px] opacity-80">{event.start} - {event.end}</div>
                  </div>
                  {!readOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(dateKey, event.id); }}
                    className="opacity-0 group-hover:opacity-100 bg-white/20 p-1 rounded-md hover:bg-white/40 transition-all"
                  >
                    🗑️
                  </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
//ななみやったよ^ ^
//全体のアプリケーション表示に関するコード(月のカレンダーの画面のコード)
function App() {
  // --- 1. 状態（State）の定義 ---
  const [user, setUser] = useState(null);
  const [bgColor, setBgColor] = useState("from-pink-50 to-orange-50");
  const [events, setEvents] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [category, setCategory] = useState("");

  const [page, setPage] = useState("start"); //スタートページの追加
  const today = new Date();
  const [schedules, setSchedules] = useState({});
  const [selectedScheduleId, setSelectedScheduleId] = useState(null); // 回答用ページで参照


  useEffect(() => {
    if (!selectedScheduleId) return;

    const responsesRef = collection(db, "scheduleEvents", selectedScheduleId, "responses");
    const unsubscribe = onSnapshot(responsesRef, snapshot => {
      const loadedResponses = {};
      snapshot.docs.forEach(doc => {
        loadedResponses[doc.id] = doc.data().answers;
      });
      setSchedules(prev => ({
        ...prev,
        [selectedScheduleId]: {
          ...prev[selectedScheduleId],
          responses: loadedResponses
        }
      }));
    });

    return () => unsubscribe();
  }, [selectedScheduleId]);

  useEffect(() => {
  const now = new Date();

  Object.values(schedules).forEach(async (schedule) => {
    const endDate = new Date(schedule.endDate);
    const expiryDate = new Date(endDate);
    expiryDate.setMonth(expiryDate.getMonth() + 1); // 終了日から1か月後

    if (now > expiryDate) {
      const { doc, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "scheduleEvents", schedule.id));
      
      // State 更新
      setSchedules(prev => {
        const copy = { ...prev };
        delete copy[schedule.id];
        return copy;
      });
    }
  });
}, [schedules]);



  // --- 2. ログイン状態の監視 ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- 3. データのリアルタイム読み取り ---
  useEffect(() => {
    let unsubscribeEvents;
    let unsubscribeCategories;

    if (user) {
      // イベントの購読
      unsubscribeEvents = subscribeToEvents(user.uid, (loadedEvents) => {
        setEvents(loadedEvents);
      });

      // ★ require を使わず、直接 collection と onSnapshot を使います
      const categoriesRef = collection(db, "users", user.uid, "categorySettings");
      
      unsubscribeCategories = onSnapshot(categoriesRef, (snapshot) => {
        const loadedCats = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (loadedCats.length > 0) {
          setCategoryOptions(loadedCats);
        } else {
          // 初期カテゴリ
          setCategoryOptions([
            { value: 'school', label: '学校', bgColor: 'bg-sky-400' },
            { value: 'work', label: '仕事', bgColor: 'bg-rose-400' }
          ]);
        }
      });
    }
    
    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeCategories) unsubscribeCategories();
    };
  }, [user]);
  
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("このカテゴリを削除しますか？")) return;
    
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      // 指定したIDのドキュメントを削除
      await deleteDoc(doc(db, "users", user.uid, "categorySettings", categoryId));
      console.log("カテゴリを削除しました");
    } catch (error) {
      console.error("カテゴリ削除エラー:", error);
    }
  };
  // --- 4. カテゴリ追加時の保存処理 ---
  const handleAddCategoryToFirebase = async (name, color) => {
    try {
      // ここも import() を使わずに上の import を使います
      const categoriesRef = collection(db, "users", user.uid, "categorySettings");
      await addDoc(categoriesRef, {
        value: name.toLowerCase(),
        label: name,
        bgColor: color
      });
    } catch (error) {
      console.error("カテゴリ保存エラー:", error);
    }
  };
  // --- 4. 各種アクション ---
  const handleLogin = async () => {
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const handleDeleteEvent = async (dateKey, eventId) => {
    if (!window.confirm("この予定を削除しますか？")) return;
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "users", user.uid, "events", eventId));
  };

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (isReadOnly) {
      setView("day");
    } else {
      setShowModal(true);
    }
  };
  const coloroptions = [
    "from-rose-50 to-orange-50",     
    "from-orange-50 to-yellow-50",   
    "from-yellow-50 to-emerald-50",  
    "from-emerald-50 to-cyan-50",    
    "from-cyan-50 to-sky-50",        
    "from-sky-50 to-purple-50",      
    "from-purple-50 to-pink-50",     
    "from-pink-50 to-rose-50",      
  ];

  // --- 5. カレンダー生成 ---
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dates = [];

  for (let i = 0; i < firstDay; i++) {
    dates.push(<div key={`e-${i}`} className="h-20 border rounded-lg bg-gray-50" />);
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
          <div key={idx} className="text-[10px] bg-blue-100 truncate px-1 rounded">
            {e.title}
          </div>
        ))}
      </div>
    );
  }

  // --- 6. JSX ---
  return (
    <>
      <div
        className={`min-h-screen bg-gradient-to-br ${bgColor} flex items-center justify-center p-4`}
      >
        <div className="absolute bottom-4 right-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-full bg-green-400 border-2 border-white"
                  title="ログイン中"
                ></div>
                <span className="text-xs text-black font-bold">
                  ログイン中
                </span>
              </div>
            ) : (
              <button
                onClick={handleLogin} // 既存のログイン関数
                className="px-3 py-1 bg-white text-sm rounded-xl shadow hover:bg-gray-100 font-bold"
              >
                ログイン
              </button>
            )}
          </div>
        {!user ? (
          <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-6">🗓️ My Calendar</h2>
            <button
              onClick={handleLogin}
              className="w-full py-3 border rounded-xl hover:bg-gray-50 font-bold"
            >
              Googleでサインイン
            </button>
          </div>

        ) : page === "start" ? (
          <StartPage
            today={today}
            events={events}
            onMonth={() => {
              setView("month");
              setPage("calendar");
            }}
            onNext={() => setPage("next")}
          />
        ) : page === "next" ? (
          <ScheduleListPage
            user={user}
            onBack={() => setPage("start")}
            setEvents={setEvents}
            setSchedules={setSchedules}
            schedules={schedules}
            setCategoryOptions={setCategoryOptions}
            setSelectedScheduleId={setSelectedScheduleId}
            setPage={setPage}
          />
        ) : page === "respond" && selectedScheduleId && schedules[selectedScheduleId] ? (
          // 回答ページ
          <RespondSchedule
            schedule={schedules[selectedScheduleId]}
            onSubmit={(userName, answers) => {
              setSchedules(prev => ({
                ...prev,
                [selectedScheduleId]: {
                  ...prev[selectedScheduleId],
                  responses: {
                    ...prev[selectedScheduleId].responses,
                    [userName]: answers
                  }
                }
              }));
              alert("回答ありがとうございました！");
              setPage("start");
            }}
          />
        ) : page === "summary" && selectedScheduleId && schedules[selectedScheduleId] ? (
            <RespondScheduleSummaryMulti
              answers={schedules[selectedScheduleId].responses}
              onBack={() => setPage("start")}
              onEditAnswer={(user) => {
                alert(`${user} の回答を編集する処理`);
                // ここに編集モーダル表示や再回答処理を入れる
              }}
              onDeleteAnswer={(user) => {
                if(window.confirm(`${user} の回答を削除しますか？`)) {
                  setSchedules(prev => {
                    const copy = { ...prev };
                    delete copy[selectedScheduleId].responses[user];
                    return copy;
                  });
                }
              }}
            />
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md">
          {view === "month" ? (
            <>
              {/* ヘッダー・色替えボタン・カレンダー表示ロジック */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={() => setBgColor(prev => {
                    const currentIndex = coloroptions.indexOf(prev);
                    return coloroptions[(currentIndex + 1) % coloroptions.length];
                  })}
                  className="text-xs px-3 py-1 rounded-full bg-purple-400 text-white hover:bg-purple-500"
                >
                  color
                </button>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <button onClick={handlePrevMonth}>◀︎</button>
                <h3 className="font-bold">{year}年 {month + 1}月</h3>
                <button onClick={handleNextMonth}>▶︎</button>
              </div>

              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsReadOnly(!isReadOnly)}
                  className={`text-xs px-3 py-1 rounded-full text-white ${isReadOnly ? "bg-red-400" : "bg-blue-400"}`}
                >
                  {isReadOnly ? "表示モード" : "編集モード"}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                {["日", "月", "火", "水", "木", "金", "土"].map((w) => <div key={w}>{w}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">{dates}</div>
            </>
          ) : (
            <DayView 
              selectedDate={selectedDate} 
              events={events} 
              setView={setView} 
              onDelete={handleDeleteEvent} // ここで削除関数を渡す
            />
          )}
        </div>
      )}
    </div>

      {showModal && (
      <EventModal
        user={user} // userを渡す（保存エラー対策）
        selectedDate={selectedDate}
        closeModal={() => setShowModal(false)}
        categoryOptions={categoryOptions}
        category={category}
        setCategory={setCategory}
        categoryModal={() => setShowCategoryModal(true)}
        onDeleteCategory={handleDeleteCategory}
      />
    )}

      {showCategoryModal && (
        <CategoryAddModal
          closeModal={() => setShowCategoryModal(false)}
          onAddCategory={(name, color) => {
            // Firebaseに保存（保存されると、上のuseEffect内のonSnapshotが検知して自動でStateが更新されます）
            handleAddCategoryToFirebase(name, color);
            setCategory(name.toLowerCase());
          }}
        />
      )}
    </>
  );
}
export default App;