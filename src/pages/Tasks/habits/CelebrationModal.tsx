import { Modal } from '../../../components/Modal';
import './Habits.css';

interface CelebrationModalProps {
  isOpen: boolean;
  count: number;
  onClose: () => void;
}

const celebrationMessages: Record<number, string> = {
  5: 'Отлично! Вы выполнили привычку уже 5 раз! 🎉',
  10: 'Потрясающе! 10 выполнений - это уже настоящий прогресс! 🌟',
  15: 'Невероятно! 15 дней подряд - вы настоящий мастер! 💪',
  20: 'Великолепно! 20 выполнений - вы создаёте новую версию себя! 🚀',
  25: 'Удивительно! 25 раз - это уже серьёзная привычка! ⭐',
  30: 'Феноменально! Месяц подряд - вы вдохновляете! 🏆',
};

const getCelebrationMessage = (count: number): string => {
  return celebrationMessages[count] || `Поздравляем! Вы выполнили привычку ${count} раз! 🎊`;
};

export function CelebrationModal({ isOpen, count, onClose }: CelebrationModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="🎉 Поздравляем!"
    >
      <div className="celebration-modal">
        <div className="celebration-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        </div>
        <p className="celebration-message">{getCelebrationMessage(count)}</p>
        <p className="celebration-subtitle">Продолжайте в том же духе!</p>
        <button className="btn btn-primary filled" onClick={onClose}>
          Продолжить
        </button>
      </div>
    </Modal>
  );
}

