import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Paper, List, ListItem, Grid, IconButton } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/Help';
import Confetti from 'react-confetti';
import './App.css';
const timer = 60
const App = () => {
    // State variables
    const [scrambledWord, setScrambledWord] = useState('');
    const [originalWord, setOriginalWord] = useState(''); // For debugging
    const [userGuess, setUserGuess] = useState('');
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [message, setMessage] = useState('');
    const [timeLeft, setTimeLeft] = useState(timer);  // timer seconds timer
    const [hint, setHint] = useState('');  // Hint for the word
    const [correctAnswer, setCorrectAnswer] = useState('');  // Correct answer
    const [currentRound, setCurrentRound] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [topScores, setTopScores] = useState([]);
    const [isMuted, setIsMuted] = useState(true);
    const [isHighScore, setIsHighScore] = useState(false);
    const [isIncorrect, setIsIncorrect] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [totalPoints, setTotalPoints] = useState(0);
    const backgroundMusic = new Audio('background.mp3');
    const correctSound = new Audio('correct.mp3');
    const incorrectSound = new Audio('incorrect.mp3');

    // Function to toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    // Styles
    const commonStyles = {
        borderRadius: "15px",
        padding: "20px"
    };

    const lightModeStyles = {
        backgroundColor: "rgba(245, 245, 220, 0.9)",
        color: "#333",
        ...commonStyles
    };

    const darkModeStyles = {
        backgroundColor: "rgba(43, 43, 43, 0.9)",
        color: "#f1f1f1",
        ...commonStyles
    };
    const buttonStyles = {
        backgroundColor: isDarkMode ? "#575757" : "#FFC07F",
        color: isDarkMode ? "#f1f1f1" : "#6B4226"
    };
    const darkModeProgressBarStyles = isDarkMode ? {
        backgroundColor: "#4a4a4a"
    } : {};

    const darkModeProgressBarFillStyles = isDarkMode ? {
        backgroundColor: "#f1f1f1"
    } : {};

    // Function to toggle mute
    const toggleMute = () => {
        setIsMuted(!isMuted);
        backgroundMusic.volume = isMuted ? 1 : 0;
        correctSound.volume = isMuted ? 1 : 0;
        incorrectSound.volume = isMuted ? 1 : 0;
    };

    // Play background music
    useEffect(() => {
        backgroundMusic.loop = true;
        backgroundMusic.volume = isMuted ? 0 : 1;
        if (!isMuted) {
            backgroundMusic.play();
        } else {
            backgroundMusic.pause();
        }
        return () => {
            backgroundMusic.pause();
        };
    }, [isMuted]);

    // Toggle dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [isDarkMode]);

    // Update top scores
    const updateTopScores = (newPoints) => {
        let updatedScores = [...topScores, newPoints];
        updatedScores.sort((a, b) => b - a);
        if (updatedScores.length > 3) {
            updatedScores.length = 3;
        }
        setTopScores(updatedScores);
        localStorage.setItem('topScores', JSON.stringify(updatedScores));
    }

    // Fetch top scores from local storage
    useEffect(() => {
        const storedScores = localStorage.getItem('topScores');
        if (storedScores) {
            setTopScores(JSON.parse(storedScores));
        }
    }, []);

    // Fetch a new word when the component mounts
    useEffect(() => {
        // Check if there is time left on the timer
        if (timeLeft > 0) {
            // Decrement the timer every second
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            // Clear the timer when the component unmounts
            return () => clearTimeout(timer);
        } else {
            // Time is up, automatically validate the user's guess
            validateGuess();
        }
    }, [timeLeft]);

    // Fetch a new word when the component mounts
    const fetchWord = async () => {
        try {
            const response = await axios.get('http://localhost:3000/get_word');
            setScrambledWord(response.data.scrambledWord);
            setOriginalWord(response.data.originalWord);
            setCorrectAnswer(response.data.originalWord);  // Update correct answer
            setTimeLeft(timer);  // Reset the timer
            setUserGuess('');  // Clear the user guess
            setHint('');  // Clear the hint
        } catch (error) {
            console.error('Error fetching word:', error);
        }
    };

    // Fetch the score
    const fetchScore = async () => {
        try {
            const response = await axios.get('http://localhost:3000/score');
            setScore(response.data);
        } catch (error) {
            console.error('Error fetching score:', error);
        }
    };

    // Fetch the hint
    const fetchHint = async (word) => {
        try {
            const response = await axios.get(`http://localhost:3000/get_hint/${word}`);
            setHint(response.data.hint);
        } catch (error) {
            console.error('Error fetching hint:', error);
        }
    };

    //Validates the guess, play the sound depending on correct or right, and then reset everything.
    const validateGuess = async () => {
        try {
            const response = await axios.post('http://localhost:3000/validate', {
                guess: userGuess,
                original: originalWord,
            });
            setScore(response.data.currentScore);
            const isCorrect = response.data.result === 'correct';
            if (isCorrect) {
                setTotalPoints(totalPoints + timeLeft);
            }
            setIsIncorrect(!isCorrect);
            if (isCorrect && !isMuted) {
                correctSound.play();
            } else if (!isCorrect && !isMuted) {
                incorrectSound.play();
            }
            setMessage(isCorrect ? 'Correct!' : `Incorrect! The correct answer was: ${correctAnswer}`);
            fetchScore();
            setUserGuess('');
            setHint('');
            if (currentRound >= 10) {  // You can set this to any number, it's for the number of rounds which I'm setting to 10
                setGameOver(true);
            } else {
                setCurrentRound(currentRound + 1);
                fetchWord();
            }
        } catch (error) {
            console.error('Error validating guess:', error);
        }
    };

    //For the shaking effect, makes sure it only shakes for one second then stops shaking
    useEffect(() => {
        if (isIncorrect) {
            const timer = setTimeout(() => setIsIncorrect(false), 1000);  // Shakes for 1 second
            return () => clearTimeout(timer);
        }
    }, [isIncorrect]);

    //Function called when startOver is pressed, resets everything
    const startOver = async () => {
        // Reset frontend state
        setGameOver(false)
        setUserGuess(''); // Reset user guess
        setScore({ correct: 0, total: 0 }); // Reset score
        setMessage(''); // Reset message
        setHint(''); // Reset hint
        setTimeLeft(timer); // Reset timer
        try {
            await axios.get('http://localhost:3000/reset_score');
        } catch (error) {
            console.error('Error resetting score:', error);
        }
        fetchWord();
        fetchScore();
    };

    // Start the game when the component mounts
    const startOverCalled = useRef(false);

    // Start the game when the component mounts
    useEffect(() => {
        if (!startOverCalled.current) {
            startOver();
            startOverCalled.current = true;
        }
    }, []);

    // Update top scores when the game is over
    useEffect(() => {
        if (gameOver) {
            updateTopScores(totalPoints);

            // Determine if the current score is a high score
            if (topScores.length < 3 || totalPoints > Math.min(...topScores)) {
                setIsHighScore(true);
            } else {
                setIsHighScore(false);
            }
        }
    }, [gameOver]);

    // Render the app
    return (
    <Paper className="app-container" style={isDarkMode ? darkModeStyles : lightModeStyles}>
        <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h2" gutterBottom>Scramble</Typography>
                </Grid>
                {gameOver ? (
                    <Grid item xs={12} className="game-over">
                        <Typography variant="h4">Game Over!</Typography>
                        {isHighScore && (
                            <Typography variant="h4">New High Score!</Typography>
                        )}
                        <Typography variant="body1">Accuracy: {((score.correct / score.total) * 100).toFixed(2)}%</Typography>
                        <Typography variant="body1">Total Points: {totalPoints}</Typography>
                        <Typography variant="h6">Top 3 Scores:</Typography>
                        <Grid container justifyContent="center">
                            <List className="top-scores">
                                <Grid container justifyContent="center" xs={12}>
                                    {topScores.map((score, index) => (
                                        <Grid item xs={4}>
                                            <ListItem key={index}>{score}</ListItem>
                                        </Grid>
                                    ))}
                                </Grid>
                            </List>
                        </Grid>
                        <Button variant="contained" style={buttonStyles} color="primary"
                                onClick={() => window.location.reload()}>Play Again</Button>
                    </Grid>
                ) : (
                    <>
                        <Grid item xs={12}>
                            <Typography variant="body1" className={isIncorrect ? "shake" : ""}>
                                Scrambled Word: {scrambledWord}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                label="Your Guess"
                                variant="outlined"
                                fullWidth
                                value={userGuess}
                                onChange={(e) => setUserGuess(e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Button variant="contained" color="primary" onClick={() => fetchHint(originalWord)}
                                    style={buttonStyles}>Get Hint</Button>
                        </Grid>

                        {hint &&
                            <Grid item xs={12}>
                                <Typography variant="body2">Hint: {hint}</Typography>
                            </Grid>
                        }

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                style={buttonStyles}
                                onClick={validateGuess}
                            >
                                Submit
                            </Button>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2">{message}</Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="body2">Score: {score.correct} / {score.total}</Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <div className="progressBar" style={{ ...darkModeProgressBarStyles }}>
                                <div className="progressBarFill" style={{ width: `${(timeLeft / timer) * 100}%`, ...darkModeProgressBarFillStyles }}></div>
                            </div>
                        </Grid>

                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                style={buttonStyles}
                                onClick={startOver}
                            >
                                Start Over
                            </Button>
                        </Grid>
                    </>
                )}
            <Grid container justifyContent="space-between">
                <Grid item xs={1}>
                    <Tooltip title="Toggle Volume">
                        <IconButton onClick={toggleMute}>
                            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                    </Tooltip>
                </Grid>
                <Grid item xs={1}>
                    <Tooltip title={
                        <div>
                            <h2>How to Play:</h2>
                            <p>Unscramble the given word and enter your guess.</p>
                            <p>You have 60 seconds for each word.</p>
                            <p>Use hints to show either definition or first three characters of the word.</p>
                            <h2>Scoring:</h2>
                            <p>You earn points based on the time left after each correct guess.</p>
                            <h2>Features:</h2>
                            <p>Click the Volume button to toggle sound.</p>
                            <p>Click the Sun/Moon button to toggle dark mode.</p>
                        </div>
                    }>
                        <IconButton>
                            <HelpIcon />
                        </IconButton>
                    </Tooltip>
                </Grid>
                <Grid item xs={1}>
                    <Tooltip title="Toggle Dark Mode">
                        <IconButton onClick={toggleDarkMode}>
                            {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
            </Grid>
        {gameOver && isHighScore && (
            <Confetti />
        )}
        </Paper>
    );
};
export default App;
