import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home">
      <header className="hero">
        <h1>Digital Assets for Every Woman</h1>
        <p>Unlock your digital potential with our personalized roadmaps and resources.</p>
        <Link to="/quiz" className="cta-button">Take the Quiz</Link>
      </header>
      <section className="features">
        <h2>Why Choose DigitallyDefined?</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <h3>Personalized Roadmaps</h3>
            <p>Get a tailored plan to help you navigate the digital landscape.</p>
          </div>
          <div className="feature-item">
            <h3>Expert Guidance</h3>
            <p>Learn from industry experts and build your digital confidence.</p>
          </div>
          <div className="feature-item">
            <h3>Community Support</h3>
            <p>Join our community of like-minded women and share your journey.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
