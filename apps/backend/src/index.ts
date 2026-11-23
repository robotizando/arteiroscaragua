import app from './app';
import { config } from './config';

const aoIniciar = () => {
  console.log(`✓ Backend rodando em http://${config.host ?? 'localhost'}:${config.port}`);
};

if (config.host) {
  app.listen(config.port, config.host, aoIniciar);
} else {
  app.listen(config.port, aoIniciar);
}
