@ECHO OFF
IF [%DEBUG%] EQU [2] (
	ECHO ON	
)

SETLOCAL
SET "TO_NUL= > nul 2> nul"
IF [%DEBUG%] NEQ [] (
	SET TO_NUL=	
)



SET "LOCAL_ERROR=0"
SET "CURRENT_DIR=%CD%"
SET "SCRIPT_DIR=%~dp0"

node "%SCRIPT_DIR%app.js" -r -s "D:\lg\GFT"

:LOCAL_EOF
ENDLOCAL & EXIT /B %LOCAL_ERROR%
