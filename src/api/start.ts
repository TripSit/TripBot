import app from './app';

import sourceMap from 'source-map-support'; // eslint-disable-line

sourceMap.install();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`); // eslint-disable-line
});
