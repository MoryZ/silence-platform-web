import request from '../../utils/request';


export function getPartitionTables() {
  return request.get( '/api/v1/partitionTables');
}


