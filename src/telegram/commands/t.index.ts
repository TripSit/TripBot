/* eslint-disable global-require */
import { Composer } from 'telegraf';

export default Composer.compose([
  require('./t.start'),
  require('./t.drug'),
  require('./t.topic'),
  require('./t.combo'),
  require('./t.breathe'),
  require('./t.combochart'),
  require('./t.irc'),
  require('./t.ban'),
  require('./t.moderateChat'),
  require('./t.gban'),
  // require('./t.eightball'),
  require('./t.about'),
  require('./t.recovery'),
  require('./t.calc-mushrooms'),
  require('./t.calc-lsd'),
]);
