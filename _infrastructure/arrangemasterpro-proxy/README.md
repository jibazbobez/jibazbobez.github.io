# Arrange Master PRO: GitHub Pages с прежним адресом

Подготовлено локально 31 октября 2026 года. DNS, Cloudflare и GitHub не изменялись.

## Что подготовлено

- Файлы сайта находятся в `arrangemasterpro/` основного репозитория `jibazbobez.github.io`.
- Источник контента: `https://andrewr.online/arrangemasterpro/` на GitHub Pages.
- Публичный адрес и canonical: `https://arrangemasterpro.andrewr.online/`.
- Существующий сайт-Worker `arrange-master-pro-site` становится потоковым прокси к этой папке. Отдельно загружать в Cloudflare HTML, CSS, изображения и видео больше не требуется.
- Ссылки на лицензирование и выдачу trial не меняются. Подписки PRO остаются $24/$49/$99 в месяц, на 1/3/8 устройств.

## Порядок переключения

1. Сделать свой коммит и push основного сайта, включая папку `arrangemasterpro/`. Дождаться успешной публикации GitHub Pages. Публичный адрес этой папки при проверке 31 октября возвращал 404, поэтому Worker пока не переключён.
2. Из корня репозитория проверить готовность GitHub-источника:

   ```powershell
   node _infrastructure/arrangemasterpro-proxy/verify-origin.mjs
   ```

   Проверяются главная, документация, trial, canonical, JSON-LD, robots, sitemap, llms, CSS/JS/изображение и byte-range видео. Переключать Worker можно после результата `readyForProxyDeployment: true`.
3. Войти в свой Cloudflare-аккаунт через Wrangler, если вход ещё не выполнен:

   ```powershell
   npx wrangler login
   ```

4. Опубликовать только подготовленный сайт-прокси:

   ```powershell
   npx wrangler deploy --config _infrastructure/arrangemasterpro-proxy/wrangler.jsonc
   ```

   Конфигурация использует имя существующего **сайт-Worker**, не licensing-worker. `custom_domain: true` сохраняет/прикрепляет поддомен и управляемые Cloudflare DNS/TLS. Этот шаг не выполнялся автоматически.
5. Проверить публичные адреса `/`, `/documentation.html`, `/trial/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` и воспроизведение видео на `arrangemasterpro.andrewr.online`.

После начального переключения последующие изменения сайта достаточно публиковать обычными коммитами в GitHub Pages. Повторное развёртывание Worker нужно только при изменении самого прокси.

## DNS и индексация

- Оставить основной `CNAME` репозитория равным `andrewr.online`.
- Сохранить `arrangemasterpro.andrewr.online` как Custom Domain Worker `arrange-master-pro-site`. Вручную вписывать текущие IP Cloudflare не нужно.
- Если поддомен уже привязан к этому Worker, отдельная замена DNS не требуется: меняется источник файлов внутри Worker. Фактическую привязку нужно проверить в Cloudflare перед публикацией.
- Не направлять CNAME на `andrewr.online/arrangemasterpro`: DNS не содержит путей. Не добавлять второй `CNAME` внутрь каталога PRO.
- Не добавлять редирект с поддомена на основной домен: такой редирект изменит публичный адрес. Прокси сохраняет его и корректно переписывает directory-redirects GitHub.
- В HTML, Open Graph, JSON-LD, sitemap, robots и llms уже используется поддомен PRO. Эти адреса сохранены; копия в каталоге GitHub указывает canonical на поддомен.
- Прокси сохраняет настоящие HTTP-статусы, включая 404, и передаёт Range/ETag/условные запросы. HTML и текстовые файлы для ботов требуют повторной проверки кеша, чтобы обновления не задерживались надолго.

## Источники

- [GitHub Pages: custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Cloudflare Workers: Custom Domains и управляемые DNS/TLS](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

Папка `_infrastructure` содержит исходники хостинга и инструкции, а не новый раздел сайта. Стандартная обработка Jekyll в GitHub Pages исключает каталоги с начальным подчёркиванием из публичной сборки.
