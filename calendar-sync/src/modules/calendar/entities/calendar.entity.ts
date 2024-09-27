import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { Event } from 'src/modules/event/entities/event.entity';
import { User } from 'src/modules/user/entities/user.entity'; // Adjust the import path as necessary

@Entity('calendars')
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  googleCalendarId: string;

  @ManyToOne(() => User, user => user.calendars)
  user: User;

  @Column()
  summary: string;

  @Column()
  channelId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  timezone: string;

  @OneToMany(() => Event, event => event.calendar, { cascade: true })
  events: Event[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Optional: To store color information and selection status
  @Column({ nullable: true })
  colorId: string;

  @Column({ nullable: true })
  backgroundColor: string;

  @Column({ nullable: true })
  foregroundColor: string;

  @Column({ default: true })
  selected: boolean;

  @Column({ nullable: true })
  accessRole: string;

  @Column('json', { nullable: true })
  defaultReminders: any[];

  @Column('json', { nullable: true })
  conferenceProperties: any;
}
