# SteelControl - Instalacao Windows

## Instalacao recomendada

1. Extraia o pacote para uma pasta permanente, por exemplo `C:\SteelControl`.
2. Clique com o botao direito em `INSTALAR_STEELCONTROL.bat` e escolha **Executar como administrador**.
3. O instalador verifica Node.js, Python 3.11 x64, PostgreSQL e C++ Build Tools.
4. Se algum componente suportado estiver ausente, o instalador pode usar o `winget` para instala-lo.
5. Quando solicitado, informe a senha do usuario `postgres`. A senha nao e gravada no log.
6. O instalador cria o banco `steelcontrol_enterprise`, gera segredos locais aleatorios, instala as dependencias, aplica migrations, executa o seed, instala a Face API e o SteelControl Edge.
7. Ao final, use o atalho **SteelControl** na Area de Trabalho.

## Atalhos criados

- **SteelControl**: inicia backend e Face API em modo de producao e abre o navegador.
- **SteelControl - Parar**: encerra apenas os processos iniciados pelo launcher de producao.
- **SteelControl Edge**: gateway industrial local.
- **SteelControl - Backup**: cria backup validado.
- **SteelControl - Restaurar**: restaura um backup validado.

## Verificacao

Execute:

```powershell
.\VERIFICAR_INSTALACAO.ps1
```

O resultado esperado e `INSTALACAO VALIDADA COM SUCESSO`.

## Observacoes

- O backend fica em `http://localhost:3000`.
- A Face API fica em `http://127.0.0.1:8000`.
- A descoberta industrial usa UDP/4210 e o Edge usa TCP/4211.
- O arquivo `backend/.env` contem credenciais locais e nunca deve ser enviado ao Git.
- Para desenvolvimento, `INICIAR_STEELCONTROL.ps1` continua disponivel. Para entrega/uso normal, prefira `INICIAR_STEELCONTROL_PRODUCAO.ps1`.
