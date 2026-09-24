import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Hero } from '../components/Hero';
import { Feature } from '../components/Feature';
import { Testimonial } from '../components/Testimonial';
import { CTA } from '../components/CTA';

const Home = () => {
  return (
    <div className="home">
      <Hero
        title="Digital Assets for Every Woman"
        subtitle="Unlock your digital potential with our personalized roadmaps and expert guidance."
        buttonText="Get Started"
        buttonLink="/quiz"
        imageUrl="/images/hero-image.jpg"
      />
      {/* Rest of the component remains unchanged */}
    </div>
  );
};

export default Home;
