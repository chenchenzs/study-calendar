import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid';
import { Fragment, useState, createContext, useRef, useContext, useEffect, useId, } from 'react'
import { Badge, Button, Calendar, Col, Form, Input, message, Modal, Row, Select, Table } from 'antd'
import type { CalendarProps, BadgeProps } from 'antd'
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs'
import type { SelectInfo } from 'antd/lib/calendar/generateCalendar'
import './App.scss'


interface RecordType {
  day: number;
  month: number;
  year: number;
  source: string;
}
interface DataListItem {
  id: string;
  type: string | undefined;
  content: string;
}

const TYPE_DICT = [
  { label: '掌握', value: 'proficiency' },
  { label: '熟悉', value: 'understand' },
  { label: '了解', value: 'know' },
]


const { Item } = Form;
export default function App() {

  const [record, setRecord] = useState<RecordType | null>(null);
  const [dataSource, setDataSource] = useState<DataListItem[]>([]);
  const [visible, setVisible] = useState(false);
  const EditableContext = createContext(null);

  function getListData(value: Dayjs) {
    let listData: { type: string; content: string }[] = []; // Specify the type of listData
    switch (value.date()) {
      case 8:
        listData = [
          { type: 'warning', content: 'This is warning event.This is warning event.' },
          { type: 'success', content: 'This is usual event1.' },
        ];
        break;
      case 10:
        listData = [
          { type: 'warning', content: 'This is warning event.' },
          { type: 'success', content: 'This is usual event.' },
          { type: 'error', content: 'This is error event.' },
        ];
        break;
      case 15:
        listData = [
          { type: 'warning', content: 'This is warning event' },
          { type: 'success', content: 'This is very long usual event......' },
          { type: 'error', content: 'This is error event 1.' },
          { type: 'error', content: 'This is error event 2.' },
          { type: 'error', content: 'This is error event 3.' },
          { type: 'error', content: 'This is error event 4.' },
        ];
        break;
      default:
    }
    return listData || [];
  };

  function handleSelect(date: Dayjs, selectInfo: SelectInfo) {
    const { source } = selectInfo;
    if (source === 'date') {
      const day = dayjs(date).date();
      const month = dayjs(date).month() + 1;
      const year = dayjs(date).year();
      setRecord({ day, month, year, source })
      setDataSource(getListData(date))
    }
    setVisible(true);
  }

  function handleSubmit() {
    console.log('dataSource', dataSource)
    const isEmpty = dataSource.some(item => !item.type || !item.content);
    if (isEmpty) return message.error('请填写完整信息');
  }

  function handleCancel() {
    setVisible(false);
    setRecord(null);
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
      type: undefined,
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
    const listData = getListData(value);
    return (
      < >
        {listData.map((item, index) => (
          <Badge
            style={{ display: 'block' }}
            key={index}
            status={item.type as BadgeProps['status']}
            text={item.content}
          />
        ))}
      </>
    );
  };

  function renderTableCell(dataIndex: keyof DataListItem, save: () => void): React.ReactNode {
    switch (dataIndex) {
      case 'type':
        return (
          <Select
            options={TYPE_DICT}
            onChange={save}
            placeholder="请选择重要性"
          />
        )
      case 'content':
        return <Input placeholder='请输入内容' allowClear onPressEnter={save} onBlur={save} />;
      default:
        return null;
    }
  }

  function EditableRow({ index, ...props }) {
    const [form] = Form.useForm();
    return (
      <Form form={form} component={false}>
        <EditableContext.Provider value={form}>
          <tr {...props} />
        </EditableContext.Provider>
      </Form>
    );
  };

  function EditableCell(props) {
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
    // if (editable) {
    //   childNode = (
    //     <Form.Item
    //       style={{ margin: 0 }}
    //       name={dataIndex}
    //       rules={[{ required: true, message: `${title}不能为空.` }]}
    //     >
    //       {renderTableCell(dataIndex, save)}
    //     </Form.Item>
    //   )
    // }
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
          {dataIndex === 'type' ? TYPE_DICT.find(item => item.value === record[dataIndex])?.label : record[dataIndex]}
        </div>
      );
    }
    console.log('children', children);

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

  const columns: ColumnsType<RecordType> = [
    {
      title: '重要性',
      dataIndex: 'type',
      onCell: record => ({
        record,
        dataIndex: 'type',
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

  return (
    <Fragment>
      <Calendar
        className="calendarWrap"
        cellRender={cellRender}
        onSelect={handleSelect}
        styles={{
          root: {
            borderRadius: '8px',
          },
        }}
      />
      <Modal
        destroyOnHidden
        width={900}
        title={`${record ? '编辑' : '新增'}记录`}
        open={visible}
        onOk={handleSubmit}

        onCancel={handleCancel}

      >

        <Button onClick={handleAdd} type="primary" style={{ marginBottom: 16, float: 'right' }}>
          Add a record
        </Button>
        <Table
          components={{
            body: {
              row: EditableRow,
              cell: EditableCell,
            },
          }}
          rowKey="id"
          pagination={dataSource?.length > 9 ? undefined : false}
          style={{ minHeight: 300 }}
          bordered
          dataSource={dataSource}
          columns={columns}
        />

      </Modal>
    </Fragment>
  )
}

