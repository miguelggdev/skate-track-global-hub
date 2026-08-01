import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Eye } from 'lucide-react';

const CompetitionResults = () => {
  const medalDistribution = [
    { type: "Gold", count: 28, color: "bg-yellow-500" },
    { type: "Silver", count: 31, color: "bg-gray-400" },
    { type: "Bronze", count: 28, color: "bg-orange-600" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Competitions Overview */}
      <Card className="lg:col-span-2 argon-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">Competition Results</CardTitle>
              <CardDescription className="text-sm text-gray-600">Performance across all competitions</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Competition performance chart</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medal Distribution */}
      <Card className="argon-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Medal Distribution</CardTitle>
          <CardDescription className="text-sm text-gray-600">This season's achievements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {medalDistribution.map((medal) => (
            <div key={medal.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg ${medal.color} flex items-center justify-center`}>
                    <Medal className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-gray-800">{medal.type}</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">{medal.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${medal.color}`}
                  style={{ width: `${(medal.count / 87) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompetitionResults;