import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { Fragment, useState, createContext, useRef, useContext, useEffect, useId, } from 'react';
import { Badge, Button, Calendar, Col, Form, Input, message, Modal, Row, Select, Table } from 'antd';
import useCalendarStore from './store';
import type { CalendarProps, BadgeProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import type { SelectInfo } from 'antd/lib/calendar/generateCalendar';
import './App.scss';


interface RecordItem {
  day: number;
  month: number;
  year: number;
  id: string;
  source: string;
}
interface DataListItem {
  id: string;
  significance: string;
  content: string;
}

const TYPE_DICT = [
  { label: '掌握', value: 'proficiency' },
  { label: '熟悉', value: 'understand' },
  { label: '了解', value: 'know' },
]

const type2StatusMap = {
  proficiency: 'error',
  understand: 'warning',
  know: 'success',
}


const { Item } = Form;
const initDate = { year: dayjs().year(), month: dayjs().month() + 1 }

export default function App() {

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [realDate, setRealDate] = useState(initDate);
  const [dataSource, setDataSource] = useState<DataListItem[]>([]);
  const [visible, setVisible] = useState(false);
  const EditableContext = createContext(null);

  const {
    list,
    addCalendarData,
    fetchCalendarData
  } = useCalendarStore();

  function getListData(value: Dayjs): RecordItem & { data: DataListItem[] } {
    const day = value.date();
    const month = value.month() + 1;
    const year = value.year();
    const listData = list.find(item => item.day === day && item.month === month && item.year === year);
    return listData || {};
  };

  function handleSelect(date: Dayjs, selectInfo: SelectInfo) {

    if (realDate?.month !== date.month() + 1) return;

    const { source } = selectInfo;
    if (source === 'date') {
      const { day, month, year, data, id } = getListData(date)

      const recordData = {
        day: day || date.date(),
        month: month || date.month() + 1,
        year: year || date.year(),
        id,
        source
      }
      setIsEdit(!!id);
      setRecord(recordData)
      setDataSource(data || []);
    }
    setVisible(true);
  }

  function handlePanelChange(date: any) {
    const dateData = { year: date.year(), month: date.month() + 1 }
    setRealDate(dateData);
    fetchCalendarData(dateData);
  }


  function handleCancel() {
    setVisible(false);
    setRecord(null);
    setDataSource([]);
    setIsEdit(false);
  }

  function handleSubmit() {
    const isEmpty = dataSource.some(item => !item.significance || !item.content);
    if (isEmpty) return message.error('请填写完整信息');
    const payload = {
      ...record,
      id: record?.id || uuid(),
      data: dataSource
    }
    addCalendarData(payload).then(res => {
      if (res.code === 200) {
        fetchCalendarData(realDate)
        handleCancel();
        message.success('保存成功');
      }

    })
  }


  function handleSave(row: DataListItem) {

    const newData = [...dataSource];
    const index = newData.findIndex(item => row.id === item.id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  }


  function handleDelete(record: DataListItem) {
    const newData = dataSource.filter(item => item.id !== record.id);
    setDataSource(newData)

  }


  function handleAdd() {
    const newData = {
      significance: undefined as unknown as 'proficiency' | 'understand' | 'know',
      content: '',
      id: uuid()
    };
    setDataSource([...dataSource, newData]);
  }

  function getMonthData(value: Dayjs) {
    if (value.month() === 8) {
      return 999;
    }
  };

  function monthCellRender(value: Dayjs) {
    const num = getMonthData(value);
    return num ? (
      <div className="notes-month">
        <section>{num}</section>
        <span>Backlog number</span>
      </div>
    ) : null;
  };

  function dateCellRender(value: Dayjs) {
    const listData = getListData(value)?.data || [];
    return (
      < >
        {listData.map((item) => (
          <Badge
            style={{ display: 'block' }}
            key={item.id}
            status={type2StatusMap[item.significance as 'proficiency' | 'understand' | 'know'] as BadgeProps['status']}
            text={item.content}
          />
        ))}
      </>
    );
  };

  function renderTableCell(dataIndex: keyof DataListItem, save: () => void): React.ReactNode {
    switch (dataIndex) {
      case 'significance':
        return (
          <Select
            options={TYPE_DICT}
            onChange={save}
            placeholder="请选择重要性"
          />
        )
      case 'content':
        return <Input showCount placeholder='请输入内容' allowClear onPressEnter={save} onBlur={save} />;
      default:
        return null;
    }
  }

  function EditableRow({ index, ...props }: any) {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form as any}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };

  function EditableCell(props: any) {
    const {
      title,
      editable,
      children,
      dataIndex,
      record,
      handleSave,
      ...restProps
    } = props

    const form = useContext<any>(EditableContext);
    const [editing, setEditing] = useState(false);
    async function save() {
      try {
        const values = await form.validateFields();
        handleSave({ ...record, ...values });
      } catch (errInfo) {
        console.log('Save failed:', errInfo);
      }
    };
    const toggleEdit = () => {
      setEditing(!editing);
      form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };
    let childNode = children;

    if (editable) {
      childNode = (editing || !record[dataIndex]) ? (
        <Item
          style={{ margin: 0 }}
          name={dataIndex}
          rules={[{ required: true, message: `${title}不能为空` }]}
        >
          {renderTableCell(dataIndex, save)}
        </Item>
      ) : (
        <div
          className="editable-cell-value-wrap"
          style={{ paddingInlineEnd: 24 }}
          onClick={toggleEdit}
        >
          {dataIndex === 'significance' ? TYPE_DICT.find(item => item.value === record[dataIndex])?.label : record[dataIndex]}
        </div>
      );
    }

    return <td key={record?.id} {...restProps}>{childNode}</td>;
  };


  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') {
      return dateCellRender(current);
    }

    if (info.type === 'month') {
      return monthCellRender(current);
    }
    return info.originNode;
  };

  const columns: ColumnsType<DataListItem> = [
    {
      title: '重要性',
      dataIndex: 'significance',
      onCell: record => ({
        record,
        dataIndex: 'significance',
        editable: true,
        title: '重要性',
        handleSave,
      }),
    },
    {
      title: '内容',
      dataIndex: 'content',
      onCell: record => ({
        record,
        dataIndex: 'content',
        editable: true,
        title: '内容',
        handleSave,
      }),
    },
    {
      title: '操作',
      dataIndex: 'operation',
      align: 'center',
      render: (_, record) => <a onClick={() => handleDelete(record)}>删除</a>,
    },
  ]

  useEffect(() => {
    fetchCalendarData(realDate);
  }, []);

  return (
    <Fragment>
      <Calendar
        className="calendarWrap"
        cellRender={cellRender}
        onSelect={handleSelect}
        onPanelChange={handlePanelChange}
        styles={{
          root: {
            borderRadius: '8px',
          },
        }}
      />
      <Modal
        destroyOnHidden
        width={900}
        title={`${isEdit ? '编辑' : '新增'}记录`}
        open={visible}
        onOk={handleSubmit}
        onCancel={handleCancel}

      >

        <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16, float: 'right' }}>
          Add a record
        </Button>
        <Table
          bordered
          components={{
            body: {
              row: EditableRow,
              cell: EditableCell,
            },
          }}
          rowKey="id"
          pagination={dataSource?.length > 9 ? undefined : false}
          style={{ minHeight: 300 }}
          dataSource={dataSource}
          columns={columns}
        />

      </Modal>
    </Fragment>
  )
}

