import express from 'express';
import { analyzeUrl } from './scanner';
import { ScannerError } from './scannerError';

const app = express();

const port = Number(
  process.env.PORT ?? 8787,
);

app.disable('x-powered-by');

app.use(
  express.json({
    limit: '16kb',
  }),
);

app.get(
  '/api/health',
  (_request, response) => {
    response.json({
      ok: true,
      service:
        'backstop-scanner',
    });
  },
);

app.post(
  '/api/scan',
  async (
    request,
    response,
  ) => {
    const url =
      typeof request.body?.url ===
      'string'
        ? request.body.url.trim()
        : '';

    if (!url) {
      response
        .status(400)
        .json({
          error:
            'A URL is required.',
        });

      return;
    }

    try {
      const result =
        await analyzeUrl(url);

      response.json(result);
    } catch (error) {
      if (
        error instanceof
        ScannerError
      ) {
        response
          .status(
            error.statusCode,
          )
          .json({
            error:
              error.message,
          });

        return;
      }

      console.error(
        'Unexpected scanner error',
        error,
      );

      response
        .status(500)
        .json({
          error:
            'Backstop hit an unexpected scanner error.',
        });
    }
  },
);

app.listen(
  port,
  () => {
    console.log(
      `Backstop scanner listening on http://localhost:${port}`,
    );
  },
);