# Trabalho 1
O trabalho consiste na implementação de um sistema que permite desenhar segmentos de reta a partir da seleção de dois pontos em um espaço bi-dimensional, assim como a posterior alteração da localização dos mesmos. O sistema deve, ainda, calcular pontos de interseção entre retas e marcar os mesmos com um circulo.

O projeto for realizado utilizando a biblioteca p5.js em modo WEBGL.

O repositório referente ao projeto pode ser encontrado em https://github.com/RenanBasilio/CG_2017.2

## Funcionalidades Implementadas
* Desenho de segmentos de reta
* Desenho de círculos com resolução (número de lados) customizável a partir de uma TRIANGLE_STRIP.
* Deslocamento de um ponto extremo da reta através do _picking_ do mesmo e pontos próximos.
* Deslocamento (translação) do segmento de reta a partir do _picking_ da mesma a partir da mesma e pontos próximos.
* Cálculo de pontos de interseção entre duas retas.
* Modificador CTRL faz o programa ignorar comandos contextuais e criar uma nova reta.