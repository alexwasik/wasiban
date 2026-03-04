'use client';

import { Typography } from 'antd';

const { Title, Text } = Typography;

interface BoardHeaderProps {
  name: string;
  description?: string | null;
}

export function BoardHeader({ name, description }: BoardHeaderProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <Title level={2} style={{ margin: 0, fontWeight: 600 }}>
        {name}
      </Title>
      {description && (
        <Text type='secondary' style={{ display: 'block', marginTop: '8px' }}>
          {description}
        </Text>
      )}
    </div>
  );
}
