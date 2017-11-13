# Trabalho 3

O trabalho consiste na implementação de um sistema que permita a configuração de _keyframes_ à posição da câmera ou cena e a animação do deslocamento da mesma entre estas posições através da interpolação vetorial.

O projeto foi realizado utilizando as bibliotecas
[three.js](https://threejs.org/) e
[live-server](https://www.npmjs.com/package/live-server).

Para executar o projeto é necessário utilizar um servidor local, que pode ser facilmente instalado e executado através da execução dos seguintes comandos no diretório do projeto (note, [node.js](https://nodejs.org/en/) deve estar instalado no sistema e o comando _npm_ deve estar instalado. Para verificar, use "npm -v".) 
~~~
npm install
npm start
~~~
O projeto estará disponível em http://localhost:8080.

Alternativamente, o projeto pode ser visualizado online em https://renanbasilio.github.io/CG_2017.2.

O repositório referente ao projeto pode se encontra em https://github.com/RenanBasilio/CG_2017.2.

## Controles
Para controle de câmera com os 6 graus de liberdade propostos (rotação em torno do objeto, rotação local e translação em 3 eixos) foram utilizados os seguintes controles:
* Translação: _left click and drag_
* Rotação em Torno do Objeto: _right click and drag_
* Rotação Local: _ctrl_ + _left click and drag_

## Funcionalidades Implementadas