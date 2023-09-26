const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
app.use(cors());
app.use(express.json());
let score = { correct: 0, total: 0 };

// Function to scramble a word
const scrambleWord = (word) => {
    let scrambled;
    do {
        scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    } while (scrambled === word);
    return scrambled;
};

// Endpoint to get a scrambled word
app.get('/get_word', async (req, res) => {
    try {
        const response = await axios.get('https://random-word-api.herokuapp.com/word');
        const randomWord = response.data[0];
        const scrambledWord = scrambleWord(randomWord);
        res.json({ scrambledWord, originalWord: randomWord }); // originalWord is included for debugging
    } catch (error) {
        console.error('Error fetching word from API:', error);
        res.status(500).send('Error fetching word');
    }
});

// Endpoint to validate the user's guess
app.post('/validate', (req, res) => {
    const { guess, original } = req.body;
    if (guess === original) {
        score.correct += 1; // Increment correct answers
        res.json({ result: 'correct', currentScore: score });
    } else {
        res.json({ result: 'incorrect', currentScore: score });
    }
    score.total += 1;
});

// Endpoint to get the current score
app.get('/score', (req, res) => {
    res.json(score);
});

// Endpoint to get a hint for the current word
app.get('/get_hint/:word', async (req, res) => {
    const originalWord = req.params.word;
    let hint;

    try {
        const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${originalWord}`);
        hint = response.data[0].meanings[0].definitions[0].definition;
    } catch (error) {
        console.error('Error fetching definition:', error);
        // Fallback to first three characters if definition is not found
        hint = originalWord.substring(0, 3);
    }
    res.json({ hint });
});

// Endpoint to get the user's accuracy
app.get('/get_accuracy', (req, res) => {
    const accuracy = score.total === 0 ? 0 : (score.correct / score.total * 100).toFixed(2);
    res.json({ accuracy });
});

// Endpoint to reset the score
app.get('/reset_score', (req, res) => {
    score = { correct: 0, total: 0 };
    res.json({ message: 'Score reset' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
