import React, { useState } from 'react';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1));

  // --- 👇 ここから計算ロジックを追加 ---

  // 1. 今表示したい年と月を取得
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0が1月, 10が11月

  // 2. 月の最初の日と最後の日を取得
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // 3. 1日が何曜日か (0=日曜, 1=月曜)
  const startDayOfWeek = firstDayOfMonth.getDay(); 

  // 4. カレンダーに表示する日付の「配列」を作る
  const dates = [];

  // (a) 月の始まる前の「空白」を埋める
  for (let i = 0; i < startDayOfWeek; i++) {
    dates.push(<div key={`empty-${i}`} className="border rounded-lg p-2 h-20"></div>);
  }

  // (b) 1日から最後の日までを埋める
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    // もし「今日」なら背景色を変える
    const today = new Date();
    const isToday = year === today.getFullYear() &&
                    month === today.getMonth() &&
                    i === today.getDate();
    
    const dateClass = isToday
      ? "bg-blue-500 text-white font-bold" // 「今日」のスタイル
      : "hover:bg-blue-50 cursor-pointer"; // それ以外

    dates.push(
      <div 
        key={`date-${i}`} 
        className={`border rounded-lg p-2 h-20 ${dateClass}`}
      >
        {i}
      </div>
    );
  }
  

// ... (ロジック部分は省略) ...

  return (
    <div className="min-h-screen bg-gray-100 p-8"> 
      <div className="container mx-auto p-6 max-w-xl bg-white rounded-xl shadow-lg">
        
        {/* 1. ヘッダー (★ここを変更) */}
        <div className="flex justify-between items-center mb-6">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors">
            &lt; 前
          </button>
          {/* JavaScriptの変数を埋め込む */}
          <h2 className="text-3xl font-bold text-gray-800">
            {year}年 {month + 1}月 
          </h2>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors">
            次 &gt;
          </button>
        </div>

        {/* 2. 曜日グリッド (変更なし) */}
        <div className="grid grid-cols-7 gap-2 text-center font-semibold text-gray-600 mb-2">
          {/* ... (日〜土) ... */}
        </div>

        {/* 3. 日付グリッド (★ここを総入れ替え) */}
        <div className="grid grid-cols-7 gap-2">
          
          {/* JavaScriptの配列（dates）をここに展開する */}
          {dates} 
          
        </div>

      </div>
    </div>
  );
}

export default App;