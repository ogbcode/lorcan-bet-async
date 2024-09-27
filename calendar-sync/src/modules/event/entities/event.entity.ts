import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Calendar } from 'src/modules/calendar/entities/calendar.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  googleEventId: string;

  @Column({nullable: true })
  summary: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'timestamp' ,nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp',nullable: true  })
  endTime: Date;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => Calendar, calendar => calendar.events)
  @JoinColumn({ name: 'calendarId' })
  calendar: Calendar;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({nullable: true })
  status: string;

  @Column({nullable: true })
  htmlLink: string;

  @Column({nullable: true })
  iCalUID: string;

  @Column({nullable: true })
  sequence: number;

  @Column({ default: false })
  useDefaultReminders: boolean;

  @Column({nullable: true })
  eventType: string;

  @Column({ nullable: true })
  timeZone: string;
}
