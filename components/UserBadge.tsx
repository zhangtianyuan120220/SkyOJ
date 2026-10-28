import React from 'react';

interface UserBadgeProps {
  username: string;
  role: string; // "GRAY", "BLUE", "GREEN", "ORANGE", "RED", "PURPLE_ADMIN"
  oiBadge?: string; // "NONE", "GREEN_1", "BLUE_6", "GOLD_8"
}

export const UserBadge: React.FC<UserBadgeProps> = ({ username, role, oiBadge }) => {
  const roleColors: Record<string, string> = {
    GRAY: 'text-gray-500 font-normal',
    BLUE: 'text-blue-500 font-medium',
    GREEN: 'text-green-600 font-semibold',
    ORANGE: 'text-orange-500 font-bold',
    RED: 'text-red-600 font-bold',
    PURPLE_ADMIN: 'text-purple-600 font-extrabold',
  };

  const badgeMap: Record<string, { text: string; bg: string; title: string }> = {
    GREEN_1: { text: '✓', bg: 'bg-green-500', title: 'CCF OI 认证 绿勾' },
    BLUE_6: { text: '✓', bg: 'bg-blue-500', title: 'CCF OI 认证 蓝勾' },
    GOLD_8: { text: '✓', bg: 'bg-yellow-500', title: 'CCF OI 认证 金勾' },
  };

  return (
    <span className="inline-flex items-center gap-1">
      <span className={roleColors[role] || roleColors.GRAY}>{username}</span>
      {oiBadge && oiBadge !== 'NONE' && badgeMap[oiBadge] && (
        <span
          title={badgeMap[oiBadge].title}
          className={`${badgeMap[oiBadge].bg} text-white text-[10px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center`}
        >
          {badgeMap[oiBadge].text}
        </span>
      )}
    </span>
  );
};