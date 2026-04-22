import api from './api';

const chatService = {
  getMessages: async (orderId, channelType) => {
    const response = await api.get(`/chat/orders/${orderId}`, {
      params: { channelType },
    });
    return response.data;
  },

  sendMessage: async (orderId, channelType, message) => {
    const response = await api.post(`/chat/orders/${orderId}`, { message }, {
      params: { channelType },
    });
    return response.data;
  },
};

export default chatService;
