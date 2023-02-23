FROM mysql:8

ENV MYSQL_ROOT_PASSWORD root
ENV MYSQL_DATABASE employee
ENV TZ "Asia/Tokyo"
ENV BIND-ADDRESS 0.0.0.0

COPY ./my.cnf /etc/mysql/conf.d/my.cnf
# COPY ./init/init.sql /docker-endpoint-initdb.d/

# CMD ["mysqld"]