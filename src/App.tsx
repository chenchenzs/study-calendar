import dayjs from 'dayjs';
import { Fragment, useState } from 'react'
import { Calendar } from 'antd'
import type { CalendarProps } from 'antd'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  const getMonthData = (value: Dayjs) => {
    if (value.month() === 8) {
      return 1394;
    }
  };

  const monthCellRender = (value: Dayjs) => {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    // if (info.type === 'date') {
    //   return dateCellRender(current);
    // }
    if (info.type === 'month') {
      return monthCellRender(current);
    }
    return info.originNode;
  };
  return (
    <Fragment>
      <Calendar mode='month' cellRender={cellRender} />
    </Fragment>
  )
}

export default App
