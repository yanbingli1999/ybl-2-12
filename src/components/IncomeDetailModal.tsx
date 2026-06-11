import { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatMoney } from '../game/EconomySystem';
import { X, Star, TrendingUp, TrendingDown, Clock, DollarSign, Filter } from 'lucide-react';
import type { IncomeRecord } from '../game/types';

interface ParsedRecord extends IncomeRecord {
  earlyBonus: number;
  staminaPenalty: number;
  urgencyBonus: number;
}

function parseRecordDetails(record: IncomeRecord): ParsedRecord {
  const details = record.details.split(' | ');
  let earlyBonus = 0;
  let staminaPenalty = 0;
  let urgencyBonus = 0;

  for (const detail of details) {
    if (detail.includes('提早送达奖励') || detail.includes('提前')) {
      const match = detail.match(/\+¥(\d+)/);
      if (match) earlyBonus = parseInt(match[1], 10);
    }
    if (detail.includes('体力透支') || detail.includes('体力不足')) {
      const match = detail.match(/-¥(\d+)/);
      if (match) staminaPenalty = parseInt(match[1], 10);
    }
    if (detail.includes('紧急单奖励')) {
      const match = detail.match(/\+¥(\d+)/);
      if (match) urgencyBonus = parseInt(match[1], 10);
    }
  }

  return { ...record, earlyBonus, staminaPenalty, urgencyBonus };
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function IncomeDetailModal() {
  const dispatch = useGameStore((state) => state.dispatch);
  const showIncomeDetail = useGameStore((state) => state.showIncomeDetail);
  const incomeRecords = useGameStore((state) => state.incomeRecords);

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'income'>('time');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const parsedRecords = useMemo(() => {
    return incomeRecords.map(parseRecordDetails);
  }, [incomeRecords]);

  const filteredAndSortedRecords = useMemo(() => {
    let records = [...parsedRecords];

    if (ratingFilter !== null) {
      records = records.filter((r) => r.rating === ratingFilter);
    }

    if (sortBy === 'time') {
      records.sort((a, b) =>
        sortOrder === 'desc' ? b.completedAt - a.completedAt : a.completedAt - b.completedAt
      );
    } else if (sortBy === 'income') {
      records.sort((a, b) =>
        sortOrder === 'desc' ? b.finalAmount - a.finalAmount : a.finalAmount - b.finalAmount
      );
    }

    return records;
  }, [parsedRecords, ratingFilter, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = filteredAndSortedRecords.reduce((sum, r) => sum + r.finalAmount, 0);
    const avgRating =
      filteredAndSortedRecords.length > 0
        ? filteredAndSortedRecords.reduce((sum, r) => sum + r.rating, 0) /
          filteredAndSortedRecords.length
        : 0;
    const maxIncome =
      filteredAndSortedRecords.length > 0
        ? Math.max(...filteredAndSortedRecords.map((r) => r.finalAmount))
        : 0;
    const minIncome =
      filteredAndSortedRecords.length > 0
        ? Math.min(...filteredAndSortedRecords.map((r) => r.finalAmount))
        : 0;

    return { total, avgRating, count: filteredAndSortedRecords.length, maxIncome, minIncome };
  }, [filteredAndSortedRecords]);

  if (!showIncomeDetail) return null;

  const toggleSort = (type: 'time' | 'income') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="game-card p-6 w-[680px] max-h-[80vh] flex flex-col animate-[fadeIn_0.3s_ease-out]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-pixel text-lg text-game-neon glow-text">收入明细</h3>
            <p className="font-retro text-xs text-gray-400 mt-1">
              共 {stats.count} 条记录
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLOSE_INCOME_DETAIL' })}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-game-night/50 rounded p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign size={14} className="text-game-streetLight" />
              <span className="font-retro text-xs text-gray-400">总收入</span>
            </div>
            <p className="font-pixel text-lg text-game-streetLight">{formatMoney(stats.total)}</p>
          </div>
          <div className="bg-game-night/50 rounded p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={14} className="text-game-streetLight" />
              <span className="font-retro text-xs text-gray-400">平均评分</span>
            </div>
            <p className="font-pixel text-lg text-game-streetLight">
              {stats.count > 0 ? stats.avgRating.toFixed(1) : '-'}
            </p>
          </div>
          <div className="bg-game-night/50 rounded p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={14} className="text-game-success" />
              <span className="font-retro text-xs text-gray-400">最高收入</span>
            </div>
            <p className="font-pixel text-lg text-game-success">{formatMoney(stats.maxIncome)}</p>
          </div>
          <div className="bg-game-night/50 rounded p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown size={14} className="text-game-danger" />
              <span className="font-retro text-xs text-gray-400">最低收入</span>
            </div>
            <p className="font-pixel text-lg text-game-danger">{formatMoney(stats.minIncome)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 pb-3 border-b border-game-neon/30">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="font-retro text-xs text-gray-400">评分筛选:</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setRatingFilter(null)}
              className={`px-2 py-1 rounded font-retro text-xs transition-colors ${
                ratingFilter === null
                  ? 'bg-game-neon text-game-night'
                  : 'bg-game-night/50 text-gray-400 hover:text-white'
              }`}
            >
              全部
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(star)}
                className={`px-2 py-1 rounded font-retro text-xs transition-colors ${
                  ratingFilter === star
                    ? 'bg-game-streetLight text-game-night'
                    : 'bg-game-night/50 text-gray-400 hover:text-white'
                }`}
              >
                {'⭐'.repeat(star)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <span className="font-retro text-xs text-gray-400">排序:</span>
          <button
            onClick={() => toggleSort('time')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-retro text-xs transition-colors ${
              sortBy === 'time'
                ? 'bg-game-neon/20 text-game-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock size={12} />
            时间
            {sortBy === 'time' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => toggleSort('income')}
            className={`flex items-center gap-1 px-2 py-1 rounded font-retro text-xs transition-colors ${
              sortBy === 'income'
                ? 'bg-game-neon/20 text-game-neon'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <DollarSign size={12} />
            收入
            {sortBy === 'income' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredAndSortedRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-retro text-sm text-gray-500">暂无收入记录</p>
              <p className="font-retro text-xs text-gray-600 mt-1">完成订单后这里会显示详细的收入信息</p>
            </div>
          ) : (
            filteredAndSortedRecords.map((record, index) => (
              <div
                key={record.id}
                className="bg-game-night/50 rounded p-3 border border-game-neon/20 hover:border-game-neon/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-xs text-game-neon">#{index + 1}</span>
                    <span className="font-retro text-xs text-gray-400">
                      {formatDateTime(record.completedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={
                          star <= record.rating
                            ? 'text-game-streetLight fill-game-streetLight'
                            : 'text-gray-600'
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-retro">基础报酬</span>
                    <span className="text-gray-300 font-retro">
                      +{formatMoney(record.baseReward)}
                    </span>
                  </div>
                  {record.earlyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-retro">提前奖励</span>
                      <span className="text-game-success font-retro">
                        +{formatMoney(record.earlyBonus)}
                      </span>
                    </div>
                  )}
                  {record.urgencyBonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-retro">紧急单奖励</span>
                      <span className="text-game-success font-retro">
                        +{formatMoney(record.urgencyBonus)}
                      </span>
                    </div>
                  )}
                  {record.latePenalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-retro">迟到扣款</span>
                      <span className="text-game-danger font-retro">
                        -{formatMoney(record.latePenalty)}
                      </span>
                    </div>
                  )}
                  {record.staminaPenalty > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-retro">体力扣款</span>
                      <span className="text-game-danger font-retro">
                        -{formatMoney(record.staminaPenalty)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-game-neon/20 pt-2 flex justify-between items-center">
                  <span className="font-retro text-xs text-gray-400">实际收入</span>
                  <span className="font-pixel text-sm text-game-streetLight">
                    {formatMoney(record.finalAmount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-game-neon/30">
          <button
            onClick={() => dispatch({ type: 'CLOSE_INCOME_DETAIL' })}
            className="pixel-btn w-full flex items-center justify-center gap-2"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
