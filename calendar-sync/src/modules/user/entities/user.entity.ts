import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import { Calendar } from 'src/modules/calendar/entities/calendar.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; 

  @Column({ nullable: true })
  profilePictureUrl: string;

  @OneToOne(() => Auth)
  @JoinColumn()
  auth: Auth; 
  
  @OneToMany(() => Calendar, calendar => calendar.user)
  calendars: Calendar; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
