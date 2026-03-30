let ioInstance;

export const setSocketServer = (io) => {
  ioInstance = io;
};

export const getSocketServer = () => ioInstance;

