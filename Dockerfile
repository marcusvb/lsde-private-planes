# build command
# docker build -t plane-with-webserver-latest .
# docker run -dit --name plane-app -p 8080:80 plane-with-webserver-latest

FROM httpd:2.4
COPY ./ /usr/local/apache2/htdocs/

# expose port for the app
EXPOSE 80

