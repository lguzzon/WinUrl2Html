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

PUSHD "%SCRIPT_DIR%"
node --prof "%SCRIPT_DIR%app.js" -r -s %1
SET "expanded_list="
FOR %%F in (isolate*.log) DO (
	CALL SET expanded_list=%%expanded_list%% "%%F"
)
node --prof-process --preprocess -j %expanded_list% | npx flamebearer
flamegraph.html
POPD

:LOCAL_EOF
ENDLOCAL & EXIT /B %LOCAL_ERROR%
