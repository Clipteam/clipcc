import {Record} from 'immutable';

export interface MonitorRecordProps {
    id: string | null;
    /** Present only if the monitor is sprite-specific, such as x position */
    spriteName?: string | null;
    /** Present only if the monitor is sprite-specific, such as x position */
    targetId?: string | null;
    opcode: string | null;
    value: unknown;
    params: unknown;
    mode: string;
    sliderMin?: number;
    sliderMax?: number;
    isDiscrete?: boolean;
    x: number | null; // (x: null, y: null) Indicates that the monitor should be auto-positioned
    y: number | null;
    width: number;
    height: number;
    visible: boolean;
    [key: string | symbol]: unknown;
}

const defaultMonitorRecord: MonitorRecordProps = {
    id: null,
    spriteName: null,
    targetId: null,
    opcode: null,
    value: null,
    params: null,
    mode: 'default',
    sliderMin: 0,
    sliderMax: 100,
    isDiscrete: true,
    x: null,
    y: null,
    width: 0,
    height: 0,
    visible: true
};

const MonitorRecord = Record<MonitorRecordProps>(defaultMonitorRecord);

export default MonitorRecord;
