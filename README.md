## 実行手順
```
git clone git@github.com:takitakit/study_search_employees_cli.git
cd study_search_employees_cli
docker compose up -d
docker compose exec app node search.js
```
## 留意点
- DBの外部接続のために`13306`ポートを使用しているため、他のアプリケーションとの衝突に留意すること