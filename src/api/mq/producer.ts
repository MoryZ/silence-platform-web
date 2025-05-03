import request from '../../utils/request';
import { ProducerConnection } from '@/types/mq/producer';


// 获取生产者组配置
export const queryProducerConnection = async (producerGroup: string, topic: string): Promise<ProducerConnection> => {
  return await request.get('/api/v1/producer/producerConnection', {
    params: { producerGroup, topic }
  })
}

